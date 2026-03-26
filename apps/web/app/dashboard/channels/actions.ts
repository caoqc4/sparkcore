"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithMessage(message: string, type: "error" | "success"): never {
  redirect(
    `/dashboard/channels?feedback=${encodeURIComponent(message)}&feedback_type=${type}`
  );
}

export async function unbindProductChannel(formData: FormData) {
  const bindingId = formData.get("binding_id");

  if (typeof bindingId !== "string" || bindingId.trim().length === 0) {
    redirectWithMessage("The channel binding to remove could not be determined.", "error");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard%2Fchannels");
  }

  const { data: existingBinding, error: existingError } = await supabase
    .from("channel_bindings")
    .select("id, metadata")
    .eq("id", bindingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    redirectWithMessage(existingError.message, "error");
  }

  if (!existingBinding) {
    redirectWithMessage("The selected channel binding is unavailable.", "error");
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
    redirectWithMessage(error.message, "error");
  }

  revalidatePath("/connect-im");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/channels");
  redirectWithMessage("Channel binding set to inactive.", "success");
}
