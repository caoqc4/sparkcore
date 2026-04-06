import {
  FIXED_IMAGE_MODEL_SLUG,
  FIXED_TEXT_MODEL_SLUG
} from "@/lib/ai/fixed-models";
import {
  getCapabilityDescription,
  getCapabilityLabel,
  loadProductBillingConfiguration,
  resolveCurrentPlanSlug,
  type ProductModelCapabilityType
} from "@/lib/product/billing";
import {
  getProductModelCatalogByCapability,
  type ProductModelCatalogItem
} from "@/lib/product/model-catalog";

export type ProductAppSettings = {
  theme: "light" | "dark" | "system";
  interfaceLanguage: string;
  contentLanguage: string;
  systemLanguageMode: "follow-content" | "manual";
  systemLanguage: string;
  notificationsEnabled: boolean;
  memoryRetentionPolicy: "standard" | "extended" | "minimal";
  dataRegion: string;
  defaultTextModelSlug: string | null;
  defaultImageModelSlug: string | null;
  defaultModelProvider: string | null;
  defaultModelId: string | null;
  customApiKeyPresent: boolean;
  customModelId: string | null;
};

export type ProductModelOption = {
  slug: string;
  displayName: string;
  provider: string;
  modelKey: string;
  qualityTier: "free" | "pro" | "premium";
  availabilityStatus: "active" | "preview" | "disabled";
  accessLevel: "included" | "upgrade_required" | "credits_required" | "hidden";
  includedUnits: number | null;
  overageMode: "blocked" | "credits" | "soft_unlimited" | null;
  creditsCost: number | null;
  isPlanDefault: boolean;
  isCatalogDefault: boolean;
  tags: string[];
  statusLabel: string | null;
};

export type ProductModelCapabilitySettings = {
  capabilityType: ProductModelCapabilityType;
  label: string;
  description: string;
  selectedSlug: string | null;
  planDefaultSlug: string | null;
  options: ProductModelOption[];
};

export type ProductSubscriptionSnapshot = {
  planName: string | null;
  planStatus: "inactive" | "trial" | "active" | "past_due" | "canceled";
  messageQuota: number | null;
  renewalDate: string | null;
  upgradeUrl: string | null;
  subscriptionCadence: string | null;
};

export type ProductDataExportPreview = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  format: string;
  createdAt: string;
};

export type ProductSettingsOperationPreview = {
  id: string;
  action:
    | "save_app_settings"
    | "save_model_settings"
    | "save_data_privacy_settings"
    | "save_subscription_snapshot"
    | "export_data"
    | "sign_out_all_sessions"
    | "delete_account";
  status: "started" | "completed" | "failed";
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type ProductSettingsCapabilities = {
  modelSettingsReady: boolean;
  subscriptionSnapshotReady: boolean;
  appPreferencesReady: boolean;
  dataPrivacyReady: boolean;
  exportReady: boolean;
  signOutAllReady: boolean;
  deleteAccountReady: boolean;
};

export type ProductSettingsPageData = {
  account: {
    userId: string;
    email: string | null;
    authLabel: string;
    authDescription: string;
  };
  appSettings: ProductAppSettings;
  modelSettings: {
    currentPlanSlug: string;
    currentPlanName: string;
    capabilities: ProductModelCapabilitySettings[];
  };
  subscriptionSummary: {
    currentPlanSlug: string;
    currentPlanName: string;
    currentPlanDescription: string | null;
    statusLabel: string;
    renewalDateLabel: string | null;
    upgradeHref: string;
    includedModelCounts: {
      text: number;
      image: number;
    };
    entitlementHighlights: Array<{
      capabilityType: "text" | "image" | "audio";
      label: string;
      value: string;
    }>;
    creditsSummary: string;
    currentBillingInterval: string;
  };
  subscription: ProductSubscriptionSnapshot;
  latestExport: ProductDataExportPreview | null;
  recentOperations: ProductSettingsOperationPreview[];
  capabilities: ProductSettingsCapabilities;
};

export const DEFAULT_PRODUCT_APP_SETTINGS: ProductAppSettings = {
  theme: "system",
  interfaceLanguage: "en",
  contentLanguage: "en",
  systemLanguageMode: "follow-content",
  systemLanguage: "en",
  notificationsEnabled: false,
  memoryRetentionPolicy: "standard",
  dataRegion: "global",
  defaultTextModelSlug: null,
  defaultImageModelSlug: null,
  defaultModelProvider: null,
  defaultModelId: null,
  customApiKeyPresent: false,
  customModelId: null
};

export const DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT: ProductSubscriptionSnapshot = {
  planName: null,
  planStatus: "inactive",
  messageQuota: null,
  renewalDate: null,
  upgradeUrl: null,
  subscriptionCadence: null,
};

function getPrimaryAuthProvider(user: {
  app_metadata?: Record<string, unknown> | null;
}) {
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata?.providers
    : [];
  const googleProvider = providers.find((item) => item === "google");

  if (googleProvider) {
    return googleProvider;
  }

  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : null;

  return provider;
}

function getAuthPresentation(user: {
  app_metadata?: Record<string, unknown> | null;
}) {
  const provider = getPrimaryAuthProvider(user);

  if (provider === "google") {
    return {
      label: "Google",
      description: "This account signs in through Google OAuth."
    };
  }

  if (provider === "email") {
    return {
      label: "Legacy email link",
      description: "This account still uses the older email-link identity."
    };
  }

  if (typeof provider === "string" && provider.length > 0) {
    return {
      label: provider,
      description: "This account signs in through an external identity provider."
    };
  }

  return {
    label: "External provider",
    description: "This account signs in through an external identity provider."
  };
}

function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function getStringMetadataValue(
  metadata: Record<string, unknown>,
  key: string
) {
  return typeof metadata[key] === "string" && metadata[key]!.toString().trim().length > 0
    ? metadata[key]!.toString()
    : null;
}

function resolveBillingInterval(planName: string | null, fallback: string | undefined): string {
  const name = (planName ?? "").toLowerCase();
  if (name.includes("quarterly") || name.includes("quarter")) return "quarterly";
  if (name.includes("yearly") || name.includes("annual")) return "yearly";
  if (name.includes("monthly") || name.includes("month")) return "monthly";
  return fallback ?? "monthly";
}

function getFixedCapabilitySlug(capabilityType: ProductModelCapabilityType) {
  return capabilityType === "text" ? FIXED_TEXT_MODEL_SLUG : FIXED_IMAGE_MODEL_SLUG;
}

function resolveCatalogAccessLevel(
  item: ProductModelCatalogItem,
  currentPlanSlug: string
): ProductModelOption["accessLevel"] {
  if (item.tier === "free") {
    return "included";
  }

  return currentPlanSlug === "pro" ? "included" : "upgrade_required";
}

function getQualitySortValue(value: ProductModelOption["qualityTier"]) {
  switch (value) {
    case "free":
      return 0;
    case "pro":
      return 1;
    case "premium":
      return 2;
  }
}

function getAvailabilitySortValue(value: ProductModelOption["availabilityStatus"]) {
  return value === "active" ? 0 : 1;
}

function getAccessSortValue(value: ProductModelOption["accessLevel"]) {
  switch (value) {
    case "included":
      return 0;
    case "upgrade_required":
      return 1;
    case "credits_required":
      return 2;
    case "hidden":
      return 3;
  }
}

function formatSubscriptionStatusLabel(status: ProductSubscriptionSnapshot["planStatus"]) {
  switch (status) {
    case "active":
      return "Active";
    case "trial":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "inactive":
    default:
      return "Free";
  }
}

function formatEntitlementLabel(capabilityType: "text" | "image" | "audio") {
  switch (capabilityType) {
    case "text":
      return "Text allowance";
    case "image":
      return "Image allowance";
    case "audio":
      return "Audio allowance";
  }
}

function formatIncludedUnits(
  capabilityType: "text" | "image" | "audio",
  units: number | null
) {
  if (units == null) {
    return capabilityType === "text" ? "Included" : "Not configured";
  }

  switch (capabilityType) {
    case "text":
      return `${units} premium turns / month`;
    case "image":
      return `${units} generations / month`;
    case "audio":
      return `${units} requests / month`;
  }
}

function isSubscriptionSummaryCapability(
  value: "text" | "image" | "audio" | "video"
): value is "text" | "image" | "audio" {
  return value === "text" || value === "image" || value === "audio";
}

export async function loadProductSettingsPageData(args: {
  supabase: any;
  user: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  };
}): Promise<ProductSettingsPageData> {
  const authPresentation = getAuthPresentation(args.user);
  const [
    { data: appSettings },
    { data: subscription },
    { data: latestExport },
    { data: recentOperations },
    billingConfiguration
  ] = await Promise.all([
    args.supabase
      .from("user_app_settings")
      .select(
        "theme, interface_language, notifications_enabled, memory_retention_policy, data_region, default_model_provider, default_model_id, custom_api_key_present, custom_model_id, metadata"
      )
      .eq("user_id", args.user.id)
      .maybeSingle(),
    args.supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status, message_quota, renewal_date, upgrade_url, metadata")
      .eq("user_id", args.user.id)
      .maybeSingle(),
    args.supabase
      .from("user_data_exports")
      .select("id, status, format, created_at")
      .eq("user_id", args.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    args.supabase
      .from("product_settings_operation_logs")
      .select("id, action, status, metadata, created_at")
      .eq("user_id", args.user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    loadProductBillingConfiguration({ supabase: args.supabase })
  ]);

  const appSettingsMetadata = asMetadataRecord(appSettings?.metadata);
  const subscriptionSnapshot = subscription
    ? {
        planName: subscription.plan_name ?? null,
        planStatus: subscription.plan_status,
        messageQuota:
          typeof subscription.message_quota === "number"
            ? subscription.message_quota
            : null,
        renewalDate: subscription.renewal_date ?? null,
        upgradeUrl: subscription.upgrade_url ?? null,
        subscriptionCadence: asMetadataRecord(subscription.metadata).subscription_cadence as string | null ?? null,
      }
    : DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT;
  const currentPlanSlug = resolveCurrentPlanSlug({
    subscription: subscriptionSnapshot,
    plans: billingConfiguration.plans
  });
  const currentPlan =
    billingConfiguration.plans.find((item) => item.slug === currentPlanSlug) ??
    billingConfiguration.plans[0] ??
    null;

  const capabilitySettings = (["text", "image"] as const).map((capabilityType) => {
    const selectedMetadataKey = `default_${capabilityType}_model_slug`;
    const entitlementByModelSlug = new Map(
      (currentPlan?.entitlements ?? [])
        .filter((item) => item.capability_type === capabilityType)
        .map((item) => [item.model_slug ?? `${capabilityType}:${item.entitlement_key}`, item])
    );
    const creditsByModelSlug = new Map(
      [...billingConfiguration.globalCreditRules, ...(currentPlan?.credit_rules ?? [])]
        .filter((item) => item.capability_type === capabilityType && item.is_active)
        .map((item) => [item.model_slug ?? "", item])
    );
    const catalogItems = getProductModelCatalogByCapability(capabilityType);
    const fixedSlug = getFixedCapabilitySlug(capabilityType);
    const options = catalogItems
      .filter((item) => item.slug === fixedSlug)
      .map((item) => {
      const entitlement =
        entitlementByModelSlug.get(item.slug) ??
        entitlementByModelSlug.get(`${capabilityType}:monthly_generations`) ??
        entitlementByModelSlug.get(`${capabilityType}:monthly_premium_turns`) ??
        entitlementByModelSlug.get(`${capabilityType}:base_text_turns`) ??
        null;
      const creditRule = creditsByModelSlug.get(item.slug) ?? null;

        return {
          slug: item.slug,
          displayName: item.displayName,
          provider: item.provider,
          modelKey: item.runtimeModelKey ?? item.replicateModelRef ?? item.slug,
          qualityTier: item.tier,
          availabilityStatus: item.uiStatus === "active" ? "active" : "disabled",
          accessLevel: resolveCatalogAccessLevel(item, currentPlanSlug),
          includedUnits: entitlement?.included_units ?? null,
          overageMode: entitlement?.overage_mode ?? null,
          creditsCost: creditRule?.credits_cost ?? null,
          isPlanDefault:
            item.isDefault &&
            (item.tier === currentPlanSlug ||
              (currentPlanSlug !== "pro" && item.tier === "free")),
          isCatalogDefault: item.isDefault,
          tags: item.tags,
          statusLabel: item.statusLabel ?? null
        } satisfies ProductModelOption;
      }).sort((left, right) => {
      const byAvailability =
        getAvailabilitySortValue(left.availabilityStatus) -
        getAvailabilitySortValue(right.availabilityStatus);

      if (byAvailability !== 0) {
        return byAvailability;
      }

      const byTier = getQualitySortValue(left.qualityTier) - getQualitySortValue(right.qualityTier);
      if (byTier !== 0) {
        return byTier;
      }

      const byPlanDefault = Number(right.isPlanDefault) - Number(left.isPlanDefault);
      if (byPlanDefault !== 0) {
        return byPlanDefault;
      }

      const byDefault = Number(right.isCatalogDefault) - Number(left.isCatalogDefault);
      if (byDefault !== 0) {
        return byDefault;
      }

      const byAccess = getAccessSortValue(left.accessLevel) - getAccessSortValue(right.accessLevel);
      if (byAccess !== 0) {
        return byAccess;
      }

      return left.displayName.localeCompare(right.displayName);
    });
    const planDefaultOption =
      options.find(
        (item) =>
          item.isPlanDefault &&
          item.accessLevel === "included" &&
          item.availabilityStatus === "active"
      ) ??
      options.find(
        (item) =>
          item.accessLevel === "included" &&
          item.availabilityStatus === "active"
      ) ??
      null;

    return {
      capabilityType,
      label: getCapabilityLabel(capabilityType),
      description: getCapabilityDescription(capabilityType),
      selectedSlug: planDefaultOption?.slug ?? fixedSlug,
      planDefaultSlug: planDefaultOption?.slug ?? null,
      options
    } satisfies ProductModelCapabilitySettings;
  });

  const includedModelCounts = {
    text: capabilitySettings
      .find((item) => item.capabilityType === "text")
      ?.options.filter(
        (item) => item.availabilityStatus === "active" && item.accessLevel === "included"
      ).length ?? 0,
    image: capabilitySettings
      .find((item) => item.capabilityType === "image")
      ?.options.filter(
        (item) => item.availabilityStatus === "active" && item.accessLevel === "included"
      ).length ?? 0
  };

  const entitlementHighlights = (currentPlan?.entitlements ?? [])
    .filter(
      (
        item
      ): item is typeof item & {
        capability_type: "text" | "image" | "audio";
        included_units: number;
      } =>
        isSubscriptionSummaryCapability(item.capability_type) &&
        item.included_units != null
    )
    .slice(0, 3)
    .map((item) => ({
      capabilityType: item.capability_type,
      label: formatEntitlementLabel(item.capability_type),
      value: formatIncludedUnits(item.capability_type, item.included_units)
    }));

  const creditsSummary =
    currentPlan?.credit_rules.some((item) => item.is_active) ||
    billingConfiguration.globalCreditRules.some((item) => item.is_active)
      ? "Credits extend image and audio usage after plan allowances are used."
      : "Credits are not configured yet for this plan.";

  return {
    account: {
      userId: args.user.id,
      email: args.user.email ?? null,
      authLabel: authPresentation.label,
      authDescription: authPresentation.description
    },
    appSettings: appSettings
      ? {
          theme: appSettings.theme,
          interfaceLanguage: appSettings.interface_language,
          contentLanguage:
            getStringMetadataValue(appSettingsMetadata, "content_language") ??
            appSettings.interface_language,
          systemLanguageMode: "follow-content",
          systemLanguage:
            getStringMetadataValue(appSettingsMetadata, "content_language") ??
            appSettings.interface_language,
          notificationsEnabled: appSettings.notifications_enabled === true,
          memoryRetentionPolicy: appSettings.memory_retention_policy,
          dataRegion: appSettings.data_region,
          defaultTextModelSlug: FIXED_TEXT_MODEL_SLUG,
          defaultImageModelSlug: FIXED_IMAGE_MODEL_SLUG,
          defaultModelProvider: appSettings.default_model_provider ?? null,
          defaultModelId: appSettings.default_model_id ?? null,
          customApiKeyPresent: appSettings.custom_api_key_present === true,
          customModelId: appSettings.custom_model_id ?? null
        }
      : DEFAULT_PRODUCT_APP_SETTINGS,
    modelSettings: {
      currentPlanSlug,
      currentPlanName: currentPlan?.name ?? currentPlanSlug,
      capabilities: capabilitySettings
    },
    subscriptionSummary: {
      currentPlanSlug,
      currentPlanName: currentPlan?.name ?? currentPlanSlug,
      currentPlanDescription: currentPlan?.description ?? null,
      statusLabel: formatSubscriptionStatusLabel(subscriptionSnapshot.planStatus),
      renewalDateLabel: subscriptionSnapshot.renewalDate,
      upgradeHref: subscriptionSnapshot.upgradeUrl ?? "/app/subscription",
      includedModelCounts,
      entitlementHighlights,
      creditsSummary,
      currentBillingInterval: resolveBillingInterval(subscriptionSnapshot.subscriptionCadence ?? subscriptionSnapshot.planName, currentPlan?.billing_interval)
    },
    subscription: subscriptionSnapshot,
    latestExport: latestExport
      ? {
          id: latestExport.id,
          status: latestExport.status,
          format: latestExport.format,
          createdAt: latestExport.created_at
        }
      : null,
    recentOperations: (recentOperations ?? []).map((item: any) => ({
      id: item.id,
      action: item.action,
      status: item.status,
      createdAt: item.created_at,
      metadata: asMetadataRecord(item.metadata)
    })),
    capabilities: {
      modelSettingsReady: true,
      subscriptionSnapshotReady: true,
      appPreferencesReady: true,
      dataPrivacyReady: true,
      exportReady: true,
      signOutAllReady: true,
      deleteAccountReady: true
    }
  };
}
