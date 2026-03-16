"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateAgentReply } from "@/lib/chat/runtime";
import { extractAndStoreMemories } from "@/lib/chat/memory";

export type SendMessageResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RetryAssistantReplyResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

export async function createThread(formData: FormData) {
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      `/chat?error=${encodeURIComponent("Choose an agent before creating a new thread.")}`
    );
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
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name")
    .eq("id", agentId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    redirect(
      `/chat?error=${encodeURIComponent(
        "The selected agent is unavailable for this workspace."
      )}`
    );
  }

  const { data: createdThread, error } = await supabase
    .from("threads")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: user.id,
      agent_id: agent.id,
      title: "New chat"
    })
    .select("id")
    .single();

  if (error || !createdThread) {
    redirect(
      `/chat?error=${encodeURIComponent(
        error?.message ?? "Failed to create the new thread."
      )}`
    );
  }

  revalidatePath("/chat");
  redirect(`/chat?thread=${encodeURIComponent(createdThread.id)}`);
}

export async function sendMessage(
  formData: FormData
): Promise<SendMessageResult> {
  const content = formData.get("content");
  const threadId = formData.get("thread_id");

  if (typeof content !== "string" || content.trim().length === 0) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: "Type a message before sending."
    };
  }

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: "The active thread could not be determined."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("id", threadId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread) {
    return {
      ok: false,
      threadId: null,
      message: "The requested thread could not be loaded."
    };
  }

  if (!thread.agent_id) {
    return {
      ok: false,
      threadId: thread.id,
      message: "This thread is not bound to an agent yet."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .eq("id", thread.agent_id)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      threadId: thread.id,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  const trimmedContent = content.trim();

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      workspace_id: workspace.id,
      user_id: user.id,
      role: "user",
      content: trimmedContent
    })
    .select("id")
    .single();

  if (insertError || !insertedMessage) {
    return {
      ok: false,
      threadId: thread.id,
      message: insertError?.message ?? "Failed to store the user message."
    };
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

  const { data: persistedMessages, error: persistedMessagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (persistedMessagesError) {
    return {
      ok: false,
      threadId: thread.id,
      message: persistedMessagesError.message
    };
  }

  const updatedMessages = [
    ...((persistedMessages ?? []) as Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>)
  ];

  const { data: assistantPlaceholder, error: assistantPlaceholderError } =
    await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: user.id,
        role: "assistant",
        content: "",
        status: "pending",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id
        }
      })
      .select("id")
      .single();

  if (assistantPlaceholderError || !assistantPlaceholder) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        assistantPlaceholderError?.message ??
        "Failed to initialize the assistant reply."
    };
  }

  try {
    await generateAgentReply({
      userId: user.id,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: updatedMessages,
      assistantMessageId: assistantPlaceholder.id
    });

    try {
      await extractAndStoreMemories({
        workspaceId: workspace.id,
        userId: user.id,
        agentId: thread.agent_id,
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
    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id,
          error_message:
            error instanceof Error
              ? error.message
              : "Failed to generate an assistant reply."
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", assistantPlaceholder.id)
      .eq("thread_id", thread.id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id);

    return {
      ok: false,
      threadId: thread.id,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate an assistant reply."
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id
  };
}

export async function retryAssistantReply(
  formData: FormData
): Promise<RetryAssistantReplyResult> {
  const failedMessageId = formData.get("failed_message_id");
  const threadId = formData.get("thread_id");

  if (
    typeof failedMessageId !== "string" ||
    failedMessageId.trim().length === 0 ||
    typeof threadId !== "string" ||
    threadId.trim().length === 0
  ) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: "The failed assistant turn could not be located."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("id", threadId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread || !thread.agent_id) {
    return {
      ok: false,
      threadId,
      message: "The active thread or its agent could not be resolved."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .eq("id", thread.agent_id)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      threadId,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (messagesError || !messages) {
    return {
      ok: false,
      threadId,
      message: messagesError?.message ?? "Failed to load thread messages."
    };
  }

  const failedIndex = messages.findIndex(
    (message) => message.id === failedMessageId && message.status === "failed"
  );

  if (failedIndex === -1) {
    return {
      ok: false,
      threadId,
      message: "The selected failed assistant turn is no longer available."
    };
  }

  const failedMessage = messages[failedIndex] as {
    id: string;
    role: "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };

  const sourceUserMessageId =
    typeof failedMessage.metadata?.user_message_id === "string"
      ? failedMessage.metadata.user_message_id
      : null;

  const promptMessages = messages
    .slice(0, failedIndex)
    .filter((message) => {
      if (message.status === "failed" || message.status === "pending") {
        return false;
      }

      if (message.role === "user" || message.role === "assistant") {
        return true;
      }

      return false;
    })
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      status: message.status,
      metadata: (message.metadata ?? {}) as Record<string, unknown>,
      created_at: message.created_at
    }));

  const latestUserMessage = [...promptMessages]
    .reverse()
    .find((message) =>
      sourceUserMessageId ? message.id === sourceUserMessageId : message.role === "user"
    );

  if (!latestUserMessage) {
    return {
      ok: false,
      threadId,
      message: "The user message for this failed reply could not be recovered."
    };
  }

  await supabase
    .from("messages")
    .update({
      status: "pending",
      metadata: {
        ...failedMessage.metadata,
        retried_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", failedMessage.id)
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id);

  try {
    await generateAgentReply({
      userId: user.id,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: promptMessages,
      assistantMessageId: failedMessage.id
    });
  } catch (error) {
    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          ...failedMessage.metadata,
          error_message:
            error instanceof Error
              ? error.message
              : "Failed to generate an assistant reply."
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", failedMessage.id)
      .eq("thread_id", thread.id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id);

    return {
      ok: false,
      threadId,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate an assistant reply."
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId
  };
}
