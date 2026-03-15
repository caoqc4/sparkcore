"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

export async function sendMessage(formData: FormData) {
  const content = formData.get("content");
  const threadId = formData.get("thread_id");

  if (typeof content !== "string" || content.trim().length === 0) {
    redirect("/chat");
  }

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    redirect("/chat");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title")
    .eq("id", threadId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread) {
    redirect("/chat");
  }

  const trimmedContent = content.trim();

  const { error: insertError } = await supabase.from("messages").insert({
    thread_id: thread.id,
    workspace_id: workspace.id,
    user_id: user.id,
    role: "user",
    content: trimmedContent
  });

  if (insertError) {
    redirect(`/chat?error=${encodeURIComponent(insertError.message)}`);
  }

  const threadPatch: {
    updated_at: string;
    title?: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (thread.title === "New chat") {
    threadPatch.title = summarizeThreadTitle(trimmedContent);
  }

  await supabase
    .from("threads")
    .update(threadPatch)
    .eq("id", thread.id)
    .eq("owner_user_id", user.id);

  revalidatePath("/chat");
  redirect("/chat");
}
