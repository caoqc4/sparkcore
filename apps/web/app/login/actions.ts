"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "/app";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

export async function signInWithGoogle(formData: FormData) {
  const next = getSafeNextPath(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/confirm?next=${encodeURIComponent(
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
        error?.message ?? "Unable to start Google sign-in."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed+out+successfully.");
}
