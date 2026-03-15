"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateAgentReply, getChatState } from "@/lib/chat/runtime";
import { extractAndStoreMemories } from "@/lib/chat/memory";

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

  const chatState = await getChatState();

  if (!chatState || !chatState.workspace || !chatState.thread || !chatState.agent) {
    redirect("/workspace");
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, agent_id")
    .eq("id", threadId)
    .eq("workspace_id", chatState.workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread) {
    redirect("/chat");
  }

  const trimmedContent = content.trim();

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      workspace_id: chatState.workspace.id,
      user_id: user.id,
      role: "user",
      content: trimmedContent
    })
    .select("id")
    .single();

  if (insertError || !insertedMessage) {
    redirect(
      `/chat?error=${encodeURIComponent(
        insertError?.message ?? "Failed to store the user message."
      )}`
    );
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

  const updatedMessages = [
    ...chatState.messages,
    {
      id: "pending-user-message",
      role: "user" as const,
      content: trimmedContent,
      created_at: new Date().toISOString()
    }
  ];

  try {
    await generateAgentReply({
      userId: user.id,
      workspace: chatState.workspace,
      thread: {
        ...chatState.thread,
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id ?? chatState.agent.id
      },
      agent: chatState.agent,
      messages: updatedMessages
    });

    try {
      await extractAndStoreMemories({
        workspaceId: chatState.workspace.id,
        userId: user.id,
        agentId: thread.agent_id ?? chatState.agent.id,
        sourceMessageId: insertedMessage.id,
        latestUserMessage: trimmedContent,
        recentContext: updatedMessages.slice(-3).map((message) => ({
          role: message.role,
          content: message.content
        }))
      });
    } catch (memoryError) {
      console.error("Memory extraction failed:", memoryError);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate an assistant reply.";

    redirect(`/chat?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/chat");
  redirect("/chat");
}
