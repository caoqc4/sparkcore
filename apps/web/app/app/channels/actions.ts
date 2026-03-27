"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function unbindProductChannel(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/channels");
  const bindingId = formData.get("binding_id");

  if (typeof bindingId !== "string" || bindingId.trim().length === 0) {
    redirectWithMessage(
      redirectPath,
      "The channel binding to remove could not be determined.",
      "error"
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: existingBinding, error: existingError } = await supabase
    .from("channel_bindings")
    .select("id, metadata")
    .eq("id", bindingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    redirectWithMessage(redirectPath, existingError.message, "error");
  }

  if (!existingBinding) {
    redirectWithMessage(redirectPath, "The selected channel binding is unavailable.", "error");
  }

  const existingMetadata =
    existingBinding.metadata &&
    typeof existingBinding.metadata === "object" &&
    !Array.isArray(existingBinding.metadata)
      ? (existingBinding.metadata as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("channel_bindings")
    .update({
      status: "inactive",
      metadata: {
        ...existingMetadata,
        unbound_at: new Date().toISOString(),
        managed_by: "dashboard-channels-page"
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", existingBinding.id)
    .eq("user_id", user.id);

  if (error) {
    redirectWithMessage(redirectPath, error.message, "error");
  }

  revalidatePath("/connect-im");
  revalidatePath("/app");
  revalidatePath("/app/channels");
  revalidatePath("/app/settings");
  redirectWithMessage(redirectPath, "Channel binding set to inactive.", "success");
}
