import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadProductBillingConfiguration,
  resolveCurrentPlanSlug,
} from "@/lib/product/billing";

type CapabilityType = "image" | "audio";

type ConsumptionReason =
  | "chat_image_generation"
  | "chat_audio_generation"
  | "chat_image_generation_refund"
  | "chat_audio_generation_refund";

type BillingModelRow = {
  id: string;
  slug: string;
  display_name: string;
};

type ConsumptionRpcResult = {
  ok?: boolean;
  code?: string;
  allowance_consumed?: number;
  paid_units?: number;
  debited_credits?: number;
  balance_after?: number;
  usage_after?: number;
  included_units?: number | null;
  usage_period_start?: string;
  usage_period_end?: string;
  required_credits?: number;
};

export class CapabilityBillingError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(message: string, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "CapabilityBillingError";
    this.code = code;
    this.details = details;
  }
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function startOfMonthlyUsagePeriod(referenceDate = new Date()) {
  return new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0)
  );
}

function endOfMonthlyUsagePeriod(referenceDate = new Date()) {
  return new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );
}

export function resolveBillingModelCapabilitySlug(args: {
  capabilityType: CapabilityType;
  productModelSlug?: string | null;
  provider?: string | null;
}) {
  const productModelSlug = args.productModelSlug ?? null;
  const provider = args.provider?.trim().toLowerCase() ?? "";

  if (args.capabilityType === "image") {
    if (productModelSlug === "image-nano-banana-pro") {
      return "image-studio-pro";
    }

    if (
      productModelSlug === "image-nano-banana" ||
      productModelSlug === "image-flux-2-pro"
    ) {
      return "image-fast-lite";
    }

    return null;
  }

  if (provider === "elevenlabs") {
    return "audio-expressive-pro";
  }

  if (provider === "azure") {
    return "audio-basic-lite";
  }

  if (productModelSlug === "audio-elevenlabs-v3" || productModelSlug === "audio-elevenlabs-multilingual-v2") {
    return "audio-expressive-pro";
  }

  if (productModelSlug === "audio-azure-ai-speech") {
    return "audio-basic-lite";
  }

  return null;
}

function findBillingEntitlement(args: {
  capabilityType: CapabilityType;
  modelCapabilitySlug: string;
  currentPlan: Awaited<ReturnType<typeof loadProductBillingConfiguration>>["plans"][number] | null;
}) {
  const entitlementKey = args.capabilityType === "audio" ? "monthly_generations" : "monthly_generations";

  return (
    args.currentPlan?.entitlements.find(
      (item) =>
        item.capability_type === args.capabilityType &&
        item.model_slug === args.modelCapabilitySlug
    ) ??
    args.currentPlan?.entitlements.find(
      (item) =>
        item.capability_type === args.capabilityType &&
        item.entitlement_key === entitlementKey &&
        item.model_slug == null
    ) ??
    args.currentPlan?.entitlements.find(
      (item) => item.capability_type === args.capabilityType && item.model_slug == null
    ) ??
    null
  );
}

function findCreditRule(args: {
  capabilityType: CapabilityType;
  modelCapabilitySlug: string;
  currentPlan: Awaited<ReturnType<typeof loadProductBillingConfiguration>>["plans"][number] | null;
  billingConfiguration: Awaited<ReturnType<typeof loadProductBillingConfiguration>>;
}) {
  const sources = [
    ...(args.currentPlan?.credit_rules ?? []),
    ...args.billingConfiguration.globalCreditRules,
  ];

  return (
    sources.find(
      (item) =>
        item.capability_type === args.capabilityType &&
        item.model_slug === args.modelCapabilitySlug &&
        item.is_active
    ) ??
    sources.find(
      (item) =>
        item.capability_type === args.capabilityType &&
        item.model_slug == null &&
        item.is_active
    ) ??
    null
  );
}

async function loadBillingContext(args: {
  userId: string;
  capabilityType: CapabilityType;
  modelCapabilitySlug: string;
}) {
  const admin = createAdminClient();
  const [billingConfiguration, subscriptionResult, modelResult] = await Promise.all([
    loadProductBillingConfiguration({ supabase: admin }),
    admin
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status")
      .eq("user_id", args.userId)
      .maybeSingle(),
    admin
      .from("product_model_capabilities")
      .select("id, slug, display_name")
      .eq("slug", args.modelCapabilitySlug)
      .maybeSingle(),
  ]);

  if (subscriptionResult.error) {
    throw new CapabilityBillingError(subscriptionResult.error.message, "billing_context_failed");
  }

  if (modelResult.error || !modelResult.data) {
    throw new CapabilityBillingError(
      modelResult.error?.message ?? "Billing model capability is unavailable.",
      "billing_model_unavailable",
      { modelCapabilitySlug: args.modelCapabilitySlug }
    );
  }

  const currentPlanSlug = resolveCurrentPlanSlug({
    subscription: {
      planName: subscriptionResult.data?.plan_name ?? null,
      planStatus: subscriptionResult.data?.plan_status ?? "inactive",
    },
    plans: billingConfiguration.plans,
  });

  const currentPlan =
    billingConfiguration.plans.find((item) => item.slug === currentPlanSlug) ?? null;
  const entitlement = findBillingEntitlement({
    capabilityType: args.capabilityType,
    modelCapabilitySlug: args.modelCapabilitySlug,
    currentPlan,
  });
  const creditRule = findCreditRule({
    capabilityType: args.capabilityType,
    modelCapabilitySlug: args.modelCapabilitySlug,
    currentPlan,
    billingConfiguration,
  });

  return {
    admin,
    billingConfiguration,
    currentPlan,
    entitlement,
    creditRule,
    billingModel: modelResult.data as BillingModelRow,
  };
}

function buildInsufficientCreditsMessage(args: {
  capabilityType: CapabilityType;
  requiredCredits: number;
  balanceAfter: number;
}) {
  const label = args.capabilityType === "image" ? "image" : "audio";
  return `This ${label} needs ${args.requiredCredits} credits, but your balance is ${args.balanceAfter}.`;
}

export async function authorizeCapabilityConsumption(args: {
  userId: string;
  capabilityType: CapabilityType;
  productModelSlug?: string | null;
  provider?: string | null;
  units?: number;
  reason: ConsumptionReason;
  metadata?: Record<string, unknown>;
}) {
  const modelCapabilitySlug = resolveBillingModelCapabilitySlug({
    capabilityType: args.capabilityType,
    productModelSlug: args.productModelSlug,
    provider: args.provider,
  });

  if (!modelCapabilitySlug) {
    throw new CapabilityBillingError(
      "This capability is not billable yet for the selected model.",
      "billing_model_mapping_missing",
      {
        capabilityType: args.capabilityType,
        productModelSlug: args.productModelSlug ?? null,
        provider: args.provider ?? null,
      }
    );
  }

  const { admin, currentPlan, entitlement, creditRule, billingModel } =
    await loadBillingContext({
      userId: args.userId,
      capabilityType: args.capabilityType,
      modelCapabilitySlug,
    });

  if (!currentPlan) {
    throw new CapabilityBillingError(
      "No active billing plan could be resolved for this account.",
      "billing_plan_missing"
    );
  }

  if (!entitlement) {
    throw new CapabilityBillingError(
      "This capability is not available on the current plan.",
      "capability_not_available",
      {
        currentPlanSlug: currentPlan.slug,
        capabilityType: args.capabilityType,
        modelCapabilitySlug,
      }
    );
  }

  if (entitlement.overage_mode === "blocked") {
    throw new CapabilityBillingError(
      "This request is blocked on the current plan.",
      "capability_blocked",
      {
        currentPlanSlug: currentPlan.slug,
        capabilityType: args.capabilityType,
      }
    );
  }

  if (entitlement.overage_mode === "soft_unlimited") {
    return {
      mode: "soft_unlimited" as const,
      currentPlanSlug: currentPlan.slug,
      billingModel,
      metricKey: entitlement.entitlement_key,
      modelCapabilitySlug,
      usagePeriodStart: null,
      usagePeriodEnd: null,
      allowanceConsumed: args.units ?? 1,
      debitedCredits: 0,
      balanceAfter: null,
      usageAfter: null,
      includedUnits: entitlement.included_units ?? null,
      paidUnits: 0,
    };
  }

  const usagePeriodStart = startOfMonthlyUsagePeriod();
  const usagePeriodEnd = endOfMonthlyUsagePeriod();
  const consumptionUnits = args.units ?? 1;
  const rpcMetadata = {
    ...(args.metadata ?? {}),
    product_model_slug: args.productModelSlug ?? null,
    billing_model_slug: modelCapabilitySlug,
    current_plan_slug: currentPlan.slug,
  };

  const { data, error } = await admin.rpc("consume_capability_units", {
    p_user_id: args.userId,
    p_capability_type: args.capabilityType,
    p_metric_key: entitlement.entitlement_key,
    p_model_capability_id: billingModel.id,
    p_usage_units: consumptionUnits,
    p_included_units: entitlement.included_units,
    p_usage_period_start: usagePeriodStart.toISOString(),
    p_usage_period_end: usagePeriodEnd.toISOString(),
    p_credits_cost_per_unit: creditRule?.credits_cost ?? 0,
    p_reason: args.reason,
    p_metadata: rpcMetadata,
  });

  if (error) {
    throw new CapabilityBillingError(error.message, "billing_rpc_failed");
  }

  const result = asRecord(data) as ConsumptionRpcResult;
  if (result.ok !== true) {
    if (result.code === "insufficient_credits") {
      throw new CapabilityBillingError(
        buildInsufficientCreditsMessage({
          capabilityType: args.capabilityType,
          requiredCredits: result.required_credits ?? 0,
          balanceAfter: result.balance_after ?? 0,
        }),
        "insufficient_credits",
        result as Record<string, unknown>
      );
    }

    throw new CapabilityBillingError(
      "Capability consumption failed.",
      result.code ?? "billing_consumption_failed",
      result as Record<string, unknown>
    );
  }

  return {
    mode: (result.debited_credits ?? 0) > 0 ? ("credits" as const) : ("allowance" as const),
    currentPlanSlug: currentPlan.slug,
    billingModel,
    metricKey: entitlement.entitlement_key,
    modelCapabilitySlug,
    usagePeriodStart: result.usage_period_start ?? usagePeriodStart.toISOString(),
    usagePeriodEnd: result.usage_period_end ?? usagePeriodEnd.toISOString(),
    allowanceConsumed: result.allowance_consumed ?? 0,
    debitedCredits: result.debited_credits ?? 0,
    balanceAfter: result.balance_after ?? null,
    usageAfter: result.usage_after ?? null,
    includedUnits: result.included_units ?? entitlement.included_units ?? null,
    paidUnits: result.paid_units ?? 0,
  };
}

export async function refundCapabilityConsumption(args: {
  userId: string;
  capabilityType: CapabilityType;
  productModelSlug?: string | null;
  provider?: string | null;
  amount: number;
  allowanceUnits?: number;
  metricKey?: string | null;
  usagePeriodStart?: string | null;
  usagePeriodEnd?: string | null;
  reason: ConsumptionReason;
  metadata?: Record<string, unknown>;
}) {
  if (args.amount <= 0 && (args.allowanceUnits ?? 0) <= 0) {
    return null;
  }

  const modelCapabilitySlug = resolveBillingModelCapabilitySlug({
    capabilityType: args.capabilityType,
    productModelSlug: args.productModelSlug,
    provider: args.provider,
  });
  const admin = createAdminClient();

  const { data: billingModel, error: modelError } = modelCapabilitySlug
    ? await admin
        .from("product_model_capabilities")
        .select("id, slug, display_name")
        .eq("slug", modelCapabilitySlug)
        .maybeSingle()
    : { data: null, error: null };

  if (modelError) {
    throw new CapabilityBillingError(modelError.message, "billing_model_lookup_failed");
  }

  const { error } = await admin.rpc("refund_capability_credits", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_capability_type: args.capabilityType,
    p_model_capability_id: billingModel?.id ?? null,
    p_reason: args.reason,
    p_metric_key: args.metricKey ?? null,
    p_allowance_units: args.allowanceUnits ?? 0,
    p_usage_period_start: args.usagePeriodStart ?? null,
    p_usage_period_end: args.usagePeriodEnd ?? null,
    p_metadata: {
      ...(args.metadata ?? {}),
      product_model_slug: args.productModelSlug ?? null,
      billing_model_slug: modelCapabilitySlug,
    },
  });

  if (error) {
    throw new CapabilityBillingError(error.message, "billing_refund_failed");
  }

  return true;
}
