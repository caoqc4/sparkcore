export type ProductAppSettings = {
  theme: "light" | "dark" | "system";
  interfaceLanguage: string;
  notificationsEnabled: boolean;
  memoryRetentionPolicy: "standard" | "extended" | "minimal";
  dataRegion: string;
  defaultModelProvider: string | null;
  defaultModelId: string | null;
  customApiKeyPresent: boolean;
  customModelId: string | null;
};

export type ProductSubscriptionSnapshot = {
  planName: string | null;
  planStatus: "inactive" | "trial" | "active" | "past_due" | "canceled";
  messageQuota: number | null;
  renewalDate: string | null;
  upgradeUrl: string | null;
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
  };
  appSettings: ProductAppSettings;
  subscription: ProductSubscriptionSnapshot;
  latestExport: ProductDataExportPreview | null;
  recentOperations: ProductSettingsOperationPreview[];
  capabilities: ProductSettingsCapabilities;
};

export const DEFAULT_PRODUCT_APP_SETTINGS: ProductAppSettings = {
  theme: "system",
  interfaceLanguage: "en",
  notificationsEnabled: false,
  memoryRetentionPolicy: "standard",
  dataRegion: "global",
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
  upgradeUrl: null
};

function getAuthLabel(user: {
  app_metadata?: Record<string, unknown> | null;
}) {
  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : null;

  if (provider === "google") {
    return "Google";
  }

  if (provider === "email") {
    return "Magic link";
  }

  return "Magic link";
}

function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

export async function loadProductSettingsPageData(args: {
  supabase: any;
  user: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  };
}): Promise<ProductSettingsPageData> {
  const [
    { data: appSettings },
    { data: subscription },
    { data: latestExport },
    { data: recentOperations }
  ] = await Promise.all([
    args.supabase
      .from("user_app_settings")
      .select(
        "theme, interface_language, notifications_enabled, memory_retention_policy, data_region, default_model_provider, default_model_id, custom_api_key_present, custom_model_id"
      )
      .eq("user_id", args.user.id)
      .maybeSingle(),
    args.supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status, message_quota, renewal_date, upgrade_url")
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
      .limit(8)
  ]);

  return {
    account: {
      userId: args.user.id,
      email: args.user.email ?? null,
      authLabel: getAuthLabel(args.user)
    },
    appSettings: appSettings
      ? {
          theme: appSettings.theme,
          interfaceLanguage: appSettings.interface_language,
          notificationsEnabled: appSettings.notifications_enabled === true,
          memoryRetentionPolicy: appSettings.memory_retention_policy,
          dataRegion: appSettings.data_region,
          defaultModelProvider: appSettings.default_model_provider ?? null,
          defaultModelId: appSettings.default_model_id ?? null,
          customApiKeyPresent: appSettings.custom_api_key_present === true,
          customModelId: appSettings.custom_model_id ?? null
        }
      : DEFAULT_PRODUCT_APP_SETTINGS,
    subscription: subscription
      ? {
          planName: subscription.plan_name ?? null,
          planStatus: subscription.plan_status,
          messageQuota:
            typeof subscription.message_quota === "number"
              ? subscription.message_quota
              : null,
          renewalDate: subscription.renewal_date ?? null,
          upgradeUrl: subscription.upgrade_url ?? null
        }
      : DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT,
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
