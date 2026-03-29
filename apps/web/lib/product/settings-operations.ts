export type ProductSettingsOperationAction =
  | "save_app_settings"
  | "save_model_settings"
  | "save_data_privacy_settings"
  | "save_subscription_snapshot"
  | "export_data"
  | "sign_out_all_sessions"
  | "delete_account";

export type ProductSettingsOperationStatus =
  | "started"
  | "completed"
  | "failed";

export async function insertProductSettingsOperationLog(args: {
  supabase: any;
  userId: string;
  action: ProductSettingsOperationAction;
  status: ProductSettingsOperationStatus;
  metadata?: Record<string, unknown>;
}) {
  const { error, data } = await args.supabase
    .from("product_settings_operation_logs")
    .insert({
      user_id: args.userId,
      action: args.action,
      status: args.status,
      metadata: args.metadata ?? {}
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to write settings operation log: ${error.message}`);
  }

  return data as { id: string };
}

export async function updateProductSettingsOperationLog(args: {
  supabase: any;
  logId: string;
  userId: string;
  status: ProductSettingsOperationStatus;
  metadata?: Record<string, unknown>;
}) {
  const { data: existing, error: existingError } = await args.supabase
    .from("product_settings_operation_logs")
    .select("metadata")
    .eq("id", args.logId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load settings operation log: ${existingError.message}`);
  }

  const existingMetadata =
    existing?.metadata &&
    typeof existing.metadata === "object" &&
    !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const { error } = await args.supabase
    .from("product_settings_operation_logs")
    .update({
      status: args.status,
      metadata: {
        ...existingMetadata,
        ...(args.metadata ?? {})
      }
    })
    .eq("id", args.logId)
    .eq("user_id", args.userId);

  if (error) {
    throw new Error(`Failed to update settings operation log: ${error.message}`);
  }
}
