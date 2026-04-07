"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";

async function getAppUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.trim();
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.trim();
  const host = requestHeaders.get("host")?.trim();

  const resolvedHost = forwardedHost || host;
  const resolvedHostIsLocal = resolvedHost
    ? resolvedHost.startsWith("localhost") || resolvedHost.startsWith("127.0.0.1")
    : false;

  if (resolvedHost && !resolvedHostIsLocal) {
    const resolvedProto = forwardedProto || "https";

    return `${resolvedProto}://${resolvedHost}`.replace(/\/+$/, "");
  }

  if (resolvedHost && resolvedHostIsLocal) {
    return `http://${resolvedHost}`.replace(/\/+$/, "");
  }

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  return "http://localhost:3000";
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "/?preview=landing";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/?preview=landing";
  }

  return value;
}

export async function signInWithGoogle(formData: FormData) {
  const { contentLanguage } = await getSiteLanguageState();
  const isZh = contentLanguage === "zh-CN";
  const next = getSafeNextPath(formData.get("next"));
  const appUrl = await getAppUrl();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/confirm?next=${encodeURIComponent(
        next
      )}`,
      queryParams: {
        prompt: "select_account"
      }
    }
  });

  if (error || typeof data?.url !== "string" || data.url.length === 0) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ?? (isZh ? "无法开始 Google 登录。" : "Unable to start Google sign-in.")
      )}&next=${encodeURIComponent(next)}`
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?preview=landing");
}
