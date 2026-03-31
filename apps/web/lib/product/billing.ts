type BillingConfiguration = {
  plans: BillingPlan[];
  modelCatalog: BillingModel[];
  globalCreditRules: BillingCreditRule[];
};

type BillingPlan = {
  slug: string;
  name: string;
  description: string | null;
  status: string;
  billing_interval: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  model_access: BillingModelAccess[];
  entitlements: BillingEntitlement[];
  credit_rules: BillingCreditRule[];
};

type BillingModel = {
  slug: string;
  capability_type: "text" | "image" | "audio" | "video";
  display_name: string;
  provider: string;
  model_key: string;
  quality_tier: "free" | "pro" | "premium";
  availability_status: "active" | "preview" | "disabled";
  metadata: Record<string, unknown>;
};

type BillingModelAccess = {
  model_slug: string;
  capability_type: "text" | "image" | "audio" | "video";
  display_name: string;
  provider: string;
  model_key: string;
  quality_tier: "free" | "pro" | "premium";
  availability_status: "active" | "preview" | "disabled";
  access_level: "included" | "upgrade_required" | "credits_required" | "hidden";
  is_default: boolean;
  metadata: Record<string, unknown>;
};

type BillingEntitlement = {
  capability_type: "text" | "image" | "audio" | "video";
  entitlement_key: string;
  model_slug: string | null;
  included_units: number | null;
  reset_interval: string;
  overage_mode: "blocked" | "credits" | "soft_unlimited";
  metadata: Record<string, unknown>;
};

type BillingCreditRule = {
  capability_type: "text" | "image" | "audio" | "video";
  billing_unit: "turn" | "generation" | "minute" | "request";
  credits_cost: number;
  model_slug: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
};

function coerceQualityTier(value: unknown): BillingModel["quality_tier"] {
  return value === "pro" || value === "premium" ? value : "free";
}

function coerceAvailabilityStatus(value: unknown): BillingModel["availability_status"] {
  return value === "preview" || value === "disabled" ? value : "active";
}

function coerceAccessLevel(value: unknown): BillingModelAccess["access_level"] {
  return value === "included" ||
    value === "credits_required" ||
    value === "hidden"
    ? value
    : "upgrade_required";
}

function coerceOverageMode(value: unknown): BillingEntitlement["overage_mode"] {
  return value === "credits" || value === "soft_unlimited" ? value : "blocked";
}

function coerceBillingUnit(value: unknown): BillingCreditRule["billing_unit"] {
  return value === "generation" || value === "minute" || value === "request"
    ? value
    : "turn";
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isCapabilityType(value: string): value is BillingModel["capability_type"] {
  return value === "text" || value === "image" || value === "audio" || value === "video";
}

export async function loadProductBillingConfiguration(args: { supabase: any }) {
  const { data, error } = await args.supabase
    .from("product_billing_configuration_overview")
    .select("configuration")
    .single();

  if (error) {
    throw new Error(`Failed to load billing configuration: ${error.message}`);
  }

  const configuration = asRecord(data?.configuration) as Record<string, unknown>;

  const plans = asArray<Record<string, unknown>>(configuration.plans).map((plan) => ({
    slug: typeof plan.slug === "string" ? plan.slug : "",
    name: typeof plan.name === "string" ? plan.name : "",
    description: typeof plan.description === "string" ? plan.description : null,
    status: typeof plan.status === "string" ? plan.status : "active",
    billing_interval:
      typeof plan.billing_interval === "string" ? plan.billing_interval : "monthly",
    is_default: plan.is_default === true,
    metadata: asRecord(plan.metadata),
    model_access: asArray<Record<string, unknown>>(plan.model_access).map((item) => ({
      model_slug: typeof item.model_slug === "string" ? item.model_slug : "",
      capability_type: isCapabilityType(String(item.capability_type))
        ? (item.capability_type as BillingModel["capability_type"])
        : "text",
      display_name: typeof item.display_name === "string" ? item.display_name : "",
      provider: typeof item.provider === "string" ? item.provider : "",
      model_key: typeof item.model_key === "string" ? item.model_key : "",
      quality_tier: coerceQualityTier(item.quality_tier),
      availability_status: coerceAvailabilityStatus(item.availability_status),
      access_level: coerceAccessLevel(item.access_level),
      is_default: item.is_default === true,
      metadata: asRecord(item.metadata)
    })),
    entitlements: asArray<Record<string, unknown>>(plan.entitlements).map((item) => ({
      capability_type: isCapabilityType(String(item.capability_type))
        ? (item.capability_type as BillingEntitlement["capability_type"])
        : "text",
      entitlement_key:
        typeof item.entitlement_key === "string" ? item.entitlement_key : "",
      model_slug: typeof item.model_slug === "string" ? item.model_slug : null,
      included_units:
        typeof item.included_units === "number" ? item.included_units : null,
      reset_interval:
        typeof item.reset_interval === "string" ? item.reset_interval : "monthly",
      overage_mode: coerceOverageMode(item.overage_mode),
      metadata: asRecord(item.metadata)
    })),
    credit_rules: asArray<Record<string, unknown>>(plan.credit_rules).map((item) => ({
      capability_type: isCapabilityType(String(item.capability_type))
        ? (item.capability_type as BillingCreditRule["capability_type"])
        : "text",
      billing_unit: coerceBillingUnit(item.billing_unit),
      credits_cost: typeof item.credits_cost === "number" ? item.credits_cost : 0,
      model_slug: typeof item.model_slug === "string" ? item.model_slug : null,
      is_active: item.is_active === true,
      metadata: asRecord(item.metadata)
    }))
  }));

  const modelCatalog = asArray<Record<string, unknown>>(configuration.model_catalog).map(
    (item) => ({
      slug: typeof item.slug === "string" ? item.slug : "",
      capability_type: isCapabilityType(String(item.capability_type))
        ? (item.capability_type as BillingModel["capability_type"])
        : "text",
      display_name: typeof item.display_name === "string" ? item.display_name : "",
      provider: typeof item.provider === "string" ? item.provider : "",
      model_key: typeof item.model_key === "string" ? item.model_key : "",
      quality_tier: coerceQualityTier(item.quality_tier),
      availability_status: coerceAvailabilityStatus(item.availability_status),
      metadata: asRecord(item.metadata)
    })
  );

  const globalCreditRules = asArray<Record<string, unknown>>(
    configuration.global_credit_rules
  ).map((item) => ({
    capability_type: isCapabilityType(String(item.capability_type))
      ? (item.capability_type as BillingCreditRule["capability_type"])
      : "text",
    billing_unit: coerceBillingUnit(item.billing_unit),
    credits_cost: typeof item.credits_cost === "number" ? item.credits_cost : 0,
    model_slug: typeof item.model_slug === "string" ? item.model_slug : null,
    is_active: item.is_active === true,
    metadata: asRecord(item.metadata)
  }));

  return {
    plans,
    modelCatalog,
    globalCreditRules
  } satisfies BillingConfiguration;
}

export async function loadCurrentProductPlanSlug(args: {
  supabase: any;
  userId: string;
}) {
  const [{ data: subscription, error }, billingConfiguration] = await Promise.all([
    args.supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status")
      .eq("user_id", args.userId)
      .maybeSingle(),
    loadProductBillingConfiguration({ supabase: args.supabase })
  ]);

  if (error) {
    throw new Error(`Failed to load subscription snapshot: ${error.message}`);
  }

  return resolveCurrentPlanSlug({
    subscription: {
      planName: subscription?.plan_name ?? null,
      planStatus: subscription?.plan_status ?? "inactive"
    },
    plans: billingConfiguration.plans
  });
}

export function resolveCurrentPlanSlug(input: {
  subscription: {
    planName: string | null;
    planStatus: string;
  };
  plans: BillingPlan[];
}) {
  const defaultPlan = input.plans.find((item) => item.is_default) ?? input.plans[0] ?? null;
  const planName = input.subscription.planName?.trim().toLowerCase() ?? "";
  const planStatus = input.subscription.planStatus;

  if ((planStatus === "active" || planStatus === "trial") && planName.length > 0) {
    const directMatch = input.plans.find((item) => item.slug === planName);
    if (directMatch) {
      return directMatch.slug;
    }

    const looseMatch = input.plans.find(
      (item) =>
        item.name.trim().toLowerCase() === planName || planName.includes(item.slug)
    );

    if (looseMatch) {
      return looseMatch.slug;
    }
  }

  return defaultPlan?.slug ?? "free";
}

export type ProductModelCapabilityType = "text" | "image" | "audio";

export function getCapabilityLabel(type: ProductModelCapabilityType) {
  switch (type) {
    case "text":
      return "Text model";
    case "image":
      return "Image model";
    case "audio":
      return "Audio model";
  }
}

export function getCapabilityDescription(type: ProductModelCapabilityType) {
  switch (type) {
    case "text":
      return "Used for primary chat quality, reasoning depth, and response tone.";
    case "image":
      return "Used when the companion generates or transforms images.";
    case "audio":
      return "Used when the companion replies with generated voice or audio messages.";
  }
}
