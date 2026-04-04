"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  resolveChatLocale,
} from "@/lib/i18n/chat-ui";
import {
  CONTENT_LANGUAGE_COOKIE,
  SYSTEM_LANGUAGE_MODE_COOKIE,
  getLanguagePreferenceCopy,
  resolveAppLanguage,
} from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";

function resolveRedirectPath(value: FormDataEntryValue | null, fallbackPath: string) {
  return typeof value === "string" && value.startsWith("/") && !value.includes("://")
    ? value
    : fallbackPath;
}

function applyLanguageCookie(name: string, value: string) {
  return {
    name,
    value,
    options: {
      httpOnly: false,
      path: "/",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 365,
    },
  };
}

function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function getStringMetadataValue(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "string" && metadata[key]!.toString().trim().length > 0
    ? metadata[key]!.toString()
    : null;
}

export async function setContentLanguage(formData: FormData) {
  const contentLanguage = resolveAppLanguage(
    typeof formData.get("language") === "string"
      ? (formData.get("language") as string)
      : undefined,
  );
  const redirectPath = resolveRedirectPath(formData.get("redirect_path"), "/");
  const cookieStore = await cookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from("user_app_settings")
      .select("interface_language, metadata")
      .eq("user_id", user.id)
      .maybeSingle();

    const metadata = asMetadataRecord(existing?.metadata);
    const nextMetadata: Record<string, unknown> = {
      ...metadata,
      content_language: contentLanguage,
      system_language_mode: "follow-content",
      system_language: contentLanguage,
    };

    await supabase.from("user_app_settings").upsert(
      {
        user_id: user.id,
        interface_language: contentLanguage,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  const cookieWrites = [
    applyLanguageCookie(CONTENT_LANGUAGE_COOKIE, contentLanguage),
    applyLanguageCookie(SYSTEM_LANGUAGE_MODE_COOKIE, "follow-content"),
    applyLanguageCookie(CHAT_UI_LANGUAGE_COOKIE, contentLanguage),
  ];

  for (const write of cookieWrites) {
    cookieStore.set(write.name, write.value, write.options);
  }

  redirect(redirectPath);
}

export async function saveLanguagePreferences(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData.get("redirect_to"), "/app/settings");
  const contentLanguage = resolveAppLanguage(
    typeof formData.get("language") === "string"
      ? (formData.get("language") as string)
      : typeof formData.get("content_language") === "string"
        ? (formData.get("content_language") as string)
      : undefined,
  );
  const cookieStore = await cookies();

  cookieStore.set(CONTENT_LANGUAGE_COOKIE, contentLanguage, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set(SYSTEM_LANGUAGE_MODE_COOKIE, "follow-content", {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set(
    CHAT_UI_LANGUAGE_COOKIE,
    contentLanguage,
    {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    },
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from("user_app_settings")
      .select("theme, notifications_enabled, memory_retention_policy, data_region, metadata")
      .eq("user_id", user.id)
      .maybeSingle();

    const metadata =
      existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};

    metadata.content_language = contentLanguage;
    metadata.system_language_mode = "follow-content";
    metadata.system_language = contentLanguage;

    await supabase.from("user_app_settings").upsert(
      {
        user_id: user.id,
        theme: existing?.theme ?? "system",
        interface_language: contentLanguage,
        notifications_enabled: existing?.notifications_enabled ?? false,
        memory_retention_policy: existing?.memory_retention_policy ?? "standard",
        data_region: existing?.data_region ?? "global",
        metadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  revalidatePath("/app");
  revalidatePath("/app/settings");
  const feedbackCopy = getLanguagePreferenceCopy(contentLanguage);

  const separator = redirectPath.includes("?") ? "&" : "?";
  redirect(
    `${redirectPath}${separator}feedback=${encodeURIComponent(feedbackCopy.savedMessage)}&feedback_type=success`,
  );
}
