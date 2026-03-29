"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PRODUCT_APP_SETTINGS,
  DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT
} from "@/lib/product/settings";
import {
  buildCurrentProductDataExport,
  createProductDataExportRecord
} from "@/lib/product/data-export";
import {
  insertProductSettingsOperationLog,
  updateProductSettingsOperationLog
} from "@/lib/product/settings-operations";
import { createClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function coerceTheme(value: string) {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_PRODUCT_APP_SETTINGS.theme;
}

function coerceMemoryRetentionPolicy(value: string) {
  return value === "standard" || value === "extended" || value === "minimal"
    ? value
    : DEFAULT_PRODUCT_APP_SETTINGS.memoryRetentionPolicy;
}

function coercePlanStatus(value: string) {
  return value === "inactive" ||
    value === "trial" ||
    value === "active" ||
    value === "past_due" ||
    value === "canceled"
    ? value
    : DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT.planStatus;
}

function coerceLanguage(value: string) {
  return value.length > 0 ? value.slice(0, 12) : DEFAULT_PRODUCT_APP_SETTINGS.interfaceLanguage;
}

function coerceDataRegion(value: string) {
  return value.length > 0 ? value.slice(0, 40) : DEFAULT_PRODUCT_APP_SETTINGS.dataRegion;
}

function coercePositiveInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function coerceIsoTimestamp(value: string) {
  if (!value) {
    return null;
  }

  const iso = new Date(value).toISOString();
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

function coerceHttpUrl(value: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function resolveRedirectPath(formData: FormData, fallbackPath: string) {
  const redirectTarget = formData.get("redirect_to");

  if (typeof redirectTarget !== "string" || redirectTarget.length === 0) {
    return fallbackPath;
  }

  if (!redirectTarget.startsWith("/") || redirectTarget.includes("://")) {
    return fallbackPath;
  }

  return redirectTarget;
}

function redirectWithMessage(
  redirectPath: string,
  message: string,
  type: "error" | "success"
): never {
  const separator = redirectPath.includes("?") ? "&" : "?";
  redirect(
    `${redirectPath}${separator}feedback=${encodeURIComponent(message)}&feedback_type=${type}`
  );
}

async function requireUserForSettings(redirectPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  return { supabase, user };
}

function revalidateSettingsSurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function saveProductAppSettings(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const theme = coerceTheme(normalizeText(formData.get("theme")));
  const interfaceLanguage = coerceLanguage(normalizeText(formData.get("interface_language")));
  const notificationsEnabled = formData.get("notifications_enabled") === "true";
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_app_settings",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { error } = await supabase.from("user_app_settings").upsert(
    {
      user_id: user.id,
      theme,
      interface_language: interfaceLanguage,
      notifications_enabled: notificationsEnabled,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      theme,
      interface_language: interfaceLanguage,
      notifications_enabled: notificationsEnabled
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(redirectPath, "App preferences saved.", "success");
}

export async function saveProductModelSettings(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const defaultModelProvider = normalizeText(formData.get("default_model_provider")) || null;
  const defaultModelId = normalizeText(formData.get("default_model_id")) || null;
  const customApiKeyPresent = formData.get("custom_api_key_present") === "true";
  const customModelId = normalizeText(formData.get("custom_model_id")) || null;
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_model_settings",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { error } = await supabase.from("user_app_settings").upsert(
    {
      user_id: user.id,
      default_model_provider: defaultModelProvider,
      default_model_id: defaultModelId,
      custom_api_key_present: customApiKeyPresent,
      custom_model_id: customModelId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      default_model_provider: defaultModelProvider,
      default_model_id: defaultModelId,
      custom_api_key_present: customApiKeyPresent,
      custom_model_id: customModelId
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(redirectPath, "Model settings saved.", "success");
}

export async function saveProductDataPrivacySettings(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const memoryRetentionPolicy = coerceMemoryRetentionPolicy(
    normalizeText(formData.get("memory_retention_policy"))
  );
  const dataRegion = coerceDataRegion(normalizeText(formData.get("data_region")));
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_data_privacy_settings",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { error } = await supabase.from("user_app_settings").upsert(
    {
      user_id: user.id,
      memory_retention_policy: memoryRetentionPolicy,
      data_region: dataRegion,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      memory_retention_policy: memoryRetentionPolicy,
      data_region: dataRegion
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(redirectPath, "Privacy settings saved.", "success");
}

export async function saveProductSubscriptionSnapshot(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const planName = normalizeText(formData.get("plan_name")) || null;
  const planStatus = coercePlanStatus(normalizeText(formData.get("plan_status")));
  const messageQuotaRaw = normalizeText(formData.get("message_quota"));
  const messageQuota = coercePositiveInteger(messageQuotaRaw);
  const renewalDate = coerceIsoTimestamp(normalizeText(formData.get("renewal_date")));
  const upgradeUrl = coerceHttpUrl(normalizeText(formData.get("upgrade_url")));
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_subscription_snapshot",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { error } = await supabase.from("user_subscription_snapshots").upsert(
    {
      user_id: user.id,
      plan_name: planName,
      plan_status: planStatus,
      message_quota: messageQuota,
      renewal_date: renewalDate,
      upgrade_url: upgradeUrl,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      plan_name: planName,
      plan_status: planStatus,
      message_quota: messageQuota,
      renewal_date: renewalDate,
      upgrade_url: upgradeUrl
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(redirectPath, "Subscription snapshot saved.", "success");
}

export async function signOutAllProductSessions(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "sign_out_all_sessions",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: { signed_out_scope: "global" }
  });

  redirect("/login?message=Signed+out+on+all+devices.");
}

export async function deleteCurrentProductAccount(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const admin = createAdminClient();
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "delete_account",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });
  const deletionSnapshot = await buildCurrentProductDataExport({
    supabase,
    user
  });
  const { data: auditRecord, error: auditInsertError } = await admin
    .from("user_account_deletion_audits")
    .insert({
      deleted_user_id: user.id,
      deleted_user_email: user.email ?? null,
      initiated_by_user_id: user.id,
      status: "requested",
      deletion_snapshot: deletionSnapshot,
      metadata: {
        initiated_from: "product_console_settings",
        redirect_path: redirectPath
      }
    })
    .select("id")
    .single();

  if (auditInsertError || !auditRecord) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: {
        error: auditInsertError?.message ?? "Unable to record account deletion audit."
      }
    });
    redirectWithMessage(redirectPath, auditInsertError?.message ?? "Unable to record account deletion audit.", "error");
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    await admin
      .from("user_account_deletion_audits")
      .update({
        status: "failed",
        metadata: {
          initiated_from: "product_console_settings",
          redirect_path: redirectPath,
          delete_error: error.message
        }
      })
      .eq("id", auditRecord.id);
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: {
        deletion_audit_id: auditRecord.id,
        error: error.message
      }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await admin
    .from("user_account_deletion_audits")
    .update({
      status: "completed",
      metadata: {
        initiated_from: "product_console_settings",
        redirect_path: redirectPath,
        delete_completed_at: new Date().toISOString()
      }
    })
    .eq("id", auditRecord.id);

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      deletion_audit_id: auditRecord.id
    }
  });

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?message=Account+deleted.");
}

export async function exportCurrentProductData(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "export_data",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { data, error } = await createProductDataExportRecord({
    supabase,
    user,
    metadata: {
      source: "settings_page",
      export_kind: "product_console_snapshot"
    }
  });

  if (error) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: error.message }
    });
    redirectWithMessage(redirectPath, error.message, "error");
  }

  await updateProductSettingsOperationLog({
    supabase,
    logId: log.id,
    userId: user.id,
    status: "completed",
    metadata: {
      export_record_id: data?.id ?? null
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(
    redirectPath,
    "A product data export snapshot has been generated for this account.",
    "success"
  );
}
