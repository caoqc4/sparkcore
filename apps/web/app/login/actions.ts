"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function requestMagicLink(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || email.trim().length === 0) {
    redirect("/login?error=Please+enter+an+email+address.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getAppUrl()}/auth/confirm`
    }
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Magic link sent. Check your inbox to continue."
    )}`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed+out+successfully.");
}
