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

export async function requestMagicLink(formData: FormData) {
  const email = formData.get("email");
  const next = getSafeNextPath(formData.get("next"));

  if (typeof email !== "string" || email.trim().length === 0) {
    redirect(
      `/login?error=Please+enter+an+email+address.&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getAppUrl()}/auth/confirm?next=${encodeURIComponent(
        next
      )}`
    }
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(
        next
      )}`
    );
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Magic link sent. Check your inbox to continue."
    )}&next=${encodeURIComponent(next)}`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed+out+successfully.");
}
