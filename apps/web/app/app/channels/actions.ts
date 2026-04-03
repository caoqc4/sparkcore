"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revokeWeChatOpenILinkSessionsForUser } from "@/lib/integrations/wechat-openilink-sessions";
import { updateOwnedChannelBindingStatus } from "@/lib/product/channels";
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

  try {
    const { data: binding, error: bindingError } = await supabase
      .from("channel_bindings")
      .select("platform, platform_user_id")
      .eq("id", bindingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (bindingError) {
      throw bindingError;
    }

    await updateOwnedChannelBindingStatus({
      supabase,
      bindingId,
      userId: user.id,
      status: "inactive",
      metadataPatch: {
        unbound_at: new Date().toISOString(),
        managed_by: "dashboard-channels-page"
      }
    });

    if (binding?.platform === "wechat") {
      await revokeWeChatOpenILinkSessionsForUser({
        supabase,
        userId: user.id,
        wechatUserId: binding.platform_user_id,
        reason: "user_unbound_channel"
      });
    }
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Unable to update the selected binding.",
      "error"
    );
  }

  revalidatePath("/connect-im");
  revalidatePath("/app");
  revalidatePath("/app/channels");
  revalidatePath("/app/settings");
  redirectWithMessage(redirectPath, "Channel binding set to inactive.", "success");
}
