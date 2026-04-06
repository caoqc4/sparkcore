"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FIXED_IMAGE_MODEL_SLUG,
  FIXED_TEXT_MODEL_SLUG
} from "@/lib/ai/fixed-models";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PRODUCT_APP_SETTINGS,
  DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT
} from "@/lib/product/settings";
import {
  loadProductBillingConfiguration,
  resolveCurrentPlanSlug
} from "@/lib/product/billing";
import { PRODUCT_MODEL_CATALOG } from "@/lib/product/model-catalog";
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

function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
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

async function getSettingsActionCopy() {
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  return {
    appSaved: isZh ? "应用偏好已保存。" : "App preferences saved.",
    noPlan: isZh ? "无法为当前账户解析有效的订阅方案。" : "No active billing plan could be resolved for this account.",
    modelNotAllowed: (capabilityType: string) =>
      isZh ? `${capabilityType === "text" ? "文本" : "图像"}模型选择不被允许。` : `Model selection is not allowed for ${capabilityType}.`,
    modelUnavailableOnPlan: (capabilityType: string) =>
      isZh ? `当前方案不可用所选${capabilityType === "text" ? "文本" : "图像"}模型。` : `The selected ${capabilityType} model is not available on your current plan.`,
    modelNotReady: isZh ? "这个模型暂时不可用。" : "This model is not available yet.",
    upgradeToUseModel: (planLabel: string, capabilityType: string) =>
      isZh
        ? `升级到 ${planLabel === "Free" ? "Pro" : planLabel} 后可使用所选${capabilityType === "text" ? "文本" : "图像"}模型。`
        : `Upgrade to ${planLabel === "Free" ? "Pro" : planLabel} to use the selected ${capabilityType} model.`,
    modelSaved: isZh ? "模型设置已保存。" : "Model settings saved.",
    privacySaved: isZh ? "隐私设置已保存。" : "Privacy settings saved.",
    subscriptionSaved: isZh ? "订阅快照已保存。" : "Subscription snapshot saved.",
    signedOutAll: isZh ? "已在所有设备上退出登录。" : "Signed out on all devices.",
    deleteAuditFailed: isZh ? "无法记录账户删除审计。" : "Unable to record account deletion audit.",
    accountDeleted: isZh ? "账户已删除。" : "Account deleted.",
    exportGenerated: isZh ? "已为当前账户生成产品数据导出快照。" : "A product data export snapshot has been generated for this account.",
  };
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
  const copy = await getSettingsActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const theme = coerceTheme(normalizeText(formData.get("theme")));
  const requestedInterfaceLanguage = normalizeText(formData.get("interface_language"));
  const notificationsEnabled = formData.get("notifications_enabled") === "true";
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_app_settings",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const { data: existingSettings } = await supabase
    .from("user_app_settings")
    .select("interface_language")
    .eq("user_id", user.id)
    .maybeSingle();

  const interfaceLanguage = requestedInterfaceLanguage
    ? coerceLanguage(requestedInterfaceLanguage)
    : existingSettings?.interface_language ?? DEFAULT_PRODUCT_APP_SETTINGS.interfaceLanguage;

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
  redirectWithMessage(redirectPath, copy.appSaved, "success");
}

export async function saveProductModelSettings(formData: FormData) {
  const copy = await getSettingsActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/settings");
  const { supabase, user } = await requireUserForSettings(redirectPath);
  const customApiKeyPresent = formData.get("custom_api_key_present") === "true";
  const requestedTextModelSlug = FIXED_TEXT_MODEL_SLUG;
  const requestedImageModelSlug = FIXED_IMAGE_MODEL_SLUG;
  const log = await insertProductSettingsOperationLog({
    supabase,
    userId: user.id,
    action: "save_model_settings",
    status: "started",
    metadata: { redirect_path: redirectPath }
  });

  const [
    { data: existingSettings },
    { data: subscription },
    billingConfiguration
  ] = await Promise.all([
    supabase
      .from("user_app_settings")
      .select("metadata")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadProductBillingConfiguration({ supabase })
  ]);
  const currentPlanSlug = resolveCurrentPlanSlug({
    subscription: {
      planName: subscription?.plan_name ?? null,
      planStatus: subscription?.plan_status ?? DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT.planStatus
    },
    plans: billingConfiguration.plans
  });
  const currentPlan = billingConfiguration.plans.find((item) => item.slug === currentPlanSlug);

  if (!currentPlan) {
    await updateProductSettingsOperationLog({
      supabase,
      logId: log.id,
      userId: user.id,
      status: "failed",
      metadata: { error: copy.noPlan }
    });
    redirectWithMessage(redirectPath, copy.noPlan, "error");
  }

  function resolveCatalogAccessLevel(tier: "free" | "pro", planSlug: string) {
    if (tier === "free") {
      return "included" as const;
    }

    return planSlug === "pro" ? ("included" as const) : ("upgrade_required" as const);
  }

  const requestedSelections = [
    { capabilityType: "text", slug: requestedTextModelSlug },
    { capabilityType: "image", slug: requestedImageModelSlug }
  ] as const;

  for (const item of requestedSelections) {
    if (!item.slug) {
      continue;
    }

    const catalogItem = PRODUCT_MODEL_CATALOG.find(
      (model) => model.capability === item.capabilityType && model.slug === item.slug
    );

    if (!catalogItem) {
      await updateProductSettingsOperationLog({
        supabase,
        logId: log.id,
        userId: user.id,
        status: "failed",
        metadata: {
          error: copy.modelNotAllowed(item.capabilityType),
          requested_model_slug: item.slug,
          capability_type: item.capabilityType,
          plan_slug: currentPlanSlug
        }
      });
      redirectWithMessage(
        redirectPath,
        copy.modelUnavailableOnPlan(item.capabilityType),
        "error"
      );
    }

    if (catalogItem.uiStatus !== "active") {
      const statusLabel = catalogItem.statusLabel ?? copy.modelNotReady;

      await updateProductSettingsOperationLog({
        supabase,
        logId: log.id,
        userId: user.id,
        status: "failed",
        metadata: {
          error: statusLabel,
          requested_model_slug: item.slug,
          capability_type: item.capabilityType,
          plan_slug: currentPlanSlug
        }
      });
      redirectWithMessage(redirectPath, statusLabel, "error");
    }

    const accessLevel = resolveCatalogAccessLevel(catalogItem.tier, currentPlanSlug);

    if (accessLevel !== "included") {
      const planLabel = currentPlan.name || currentPlan.slug || "Pro";
      const upgradeMessage = copy.upgradeToUseModel(planLabel, item.capabilityType);

      await updateProductSettingsOperationLog({
        supabase,
        logId: log.id,
        userId: user.id,
        status: "failed",
        metadata: {
          error: upgradeMessage,
          requested_model_slug: item.slug,
          capability_type: item.capabilityType,
          plan_slug: currentPlanSlug,
          access_level: accessLevel
        }
      });
      redirectWithMessage(redirectPath, upgradeMessage, "error");
    }
  }

  const nextMetadata = asMetadataRecord(existingSettings?.metadata);
  if (requestedTextModelSlug) {
    nextMetadata.default_text_model_slug = requestedTextModelSlug;
  }
  if (requestedImageModelSlug) {
    nextMetadata.default_image_model_slug = requestedImageModelSlug;
  }

  const { error } = await supabase.from("user_app_settings").upsert(
    {
      user_id: user.id,
      metadata: nextMetadata,
      custom_api_key_present: customApiKeyPresent,
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
      default_text_model_slug: requestedTextModelSlug,
      default_image_model_slug: requestedImageModelSlug,
      custom_api_key_present: customApiKeyPresent,
      plan_slug: currentPlanSlug
    }
  });

  revalidateSettingsSurfaces();
  redirectWithMessage(redirectPath, copy.modelSaved, "success");
}

export async function saveProductDataPrivacySettings(formData: FormData) {
  const copy = await getSettingsActionCopy();
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
  redirectWithMessage(redirectPath, copy.privacySaved, "success");
}

export async function saveProductSubscriptionSnapshot(formData: FormData) {
  const copy = await getSettingsActionCopy();
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
  redirectWithMessage(redirectPath, copy.subscriptionSaved, "success");
}

export async function signOutAllProductSessions(formData: FormData) {
  const copy = await getSettingsActionCopy();
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

  redirect(`/login?message=${encodeURIComponent(copy.signedOutAll)}`);
}

export async function deleteCurrentProductAccount(formData: FormData) {
  const copy = await getSettingsActionCopy();
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
        error: auditInsertError?.message ?? copy.deleteAuditFailed
      }
    });
    redirectWithMessage(redirectPath, auditInsertError?.message ?? copy.deleteAuditFailed, "error");
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
  redirect(`/login?message=${encodeURIComponent(copy.accountDeleted)}`);
}

export async function exportCurrentProductData(formData: FormData) {
  const copy = await getSettingsActionCopy();
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
    copy.exportGenerated,
    "success"
  );
}
