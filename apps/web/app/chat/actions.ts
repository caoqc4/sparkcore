"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateAgentReply, getDefaultModelProfile } from "@/lib/chat/runtime";
import { extractAndStoreMemories } from "@/lib/chat/memory";
import { LiteLLMError, LiteLLMTimeoutError } from "@/lib/litellm/client";

export type SendMessageResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RetryAssistantReplyResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RenameThreadResult =
  | { ok: true; threadId: string; title: string }
  | { ok: false; threadId: string | null; message: string };

export type CreateAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: null; message: string };

export type RenameAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: string | null; message: string };

type AssistantErrorType = "timeout" | "provider_error" | "generation_failed";

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

function normalizeThreadTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return normalized.slice(0, 80).trimEnd();
}

function normalizeAgentName(name: string, fallbackName: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  const candidate = normalized.length > 0 ? normalized : fallbackName;

  if (candidate.length <= 80) {
    return candidate;
  }

  return candidate.slice(0, 80).trimEnd();
}

function classifyAssistantError(error: unknown): {
  errorType: AssistantErrorType;
  message: string;
} {
  if (error instanceof LiteLLMTimeoutError) {
    return {
      errorType: "timeout",
      message:
        "Assistant reply timed out. You can retry this turn without resending your message."
    };
  }

  if (error instanceof LiteLLMError) {
    return {
      errorType: "provider_error",
      message: `Provider error: ${error.message}`
    };
  }

  if (error instanceof Error) {
    return {
      errorType: "generation_failed",
      message: error.message
    };
  }

  return {
    errorType: "generation_failed",
    message: "Failed to generate an assistant reply."
  };
}

function buildChatRedirectTarget(threadId: FormDataEntryValue | null) {
  return typeof threadId === "string" && threadId.trim().length > 0
    ? `/chat?thread=${encodeURIComponent(threadId)}`
    : "/chat";
}

export async function createAgentFromPersonaPack(
  formData: FormData
): Promise<CreateAgentResult> {
  const personaPackId = formData.get("persona_pack_id");
  const requestedName = formData.get("agent_name");

  if (typeof personaPackId !== "string" || personaPackId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: "Choose a persona pack before creating an agent."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId: null,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      ok: false,
      agentId: null,
      message: "No workspace is available for this account."
    };
  }

  const { data: personaPack } = await supabase
    .from("persona_packs")
    .select(
      "id, slug, name, description, persona_summary, style_prompt, system_prompt"
    )
    .eq("id", personaPackId)
    .eq("is_active", true)
    .maybeSingle();

  if (!personaPack) {
    return {
      ok: false,
      agentId: null,
      message: "The selected persona pack is unavailable."
    };
  }

  const defaultModelProfile = await getDefaultModelProfile();
  const agentName = normalizeAgentName(
    typeof requestedName === "string" ? requestedName : "",
    personaPack.name
  );

  const { data: createdAgent, error } = await supabase
    .from("agents")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: user.id,
      source_persona_pack_id: personaPack.id,
      name: agentName,
      persona_summary: personaPack.persona_summary,
      style_prompt: personaPack.style_prompt,
      system_prompt: personaPack.system_prompt,
      default_model_profile_id: defaultModelProfile.id,
      is_custom: false,
      metadata: {
        created_from_chat: true,
        source_slug: personaPack.slug,
        source_description: personaPack.description
      }
    })
    .select("id, name")
    .single();

  if (error || !createdAgent) {
    return {
      ok: false,
      agentId: null,
      message: error?.message ?? "Failed to create the new agent."
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: createdAgent.id,
    agentName: createdAgent.name
  };
}

export async function renameAgent(
  formData: FormData
): Promise<RenameAgentResult> {
  const agentId = formData.get("agent_id");
  const agentName = formData.get("agent_name");
  const modelProfileId = formData.get("model_profile_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: "The agent to rename could not be determined."
    };
  }

  if (typeof agentName !== "string") {
    return {
      ok: false,
      agentId,
      message: "Type an agent name before saving."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, workspace_id, default_model_profile_id")
    .eq("id", agentId)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      agentId,
      message: "The selected agent is unavailable."
    };
  }

  const normalizedName = normalizeAgentName(agentName, agent.name);
  let nextModelProfileId = agent.default_model_profile_id ?? null;

  if (typeof modelProfileId === "string" && modelProfileId.trim().length > 0) {
    const { data: modelProfile } = await supabase
      .from("model_profiles")
      .select("id")
      .eq("id", modelProfileId)
      .eq("is_active", true)
      .maybeSingle();

    if (!modelProfile) {
      return {
        ok: false,
        agentId,
        message: "The selected model profile is unavailable."
      };
    }

    nextModelProfileId = modelProfile.id;
  }

  const { data: updatedAgent, error } = await supabase
    .from("agents")
    .update({
      name: normalizedName,
      default_model_profile_id: nextModelProfileId,
      updated_at: new Date().toISOString()
    })
    .eq("id", agent.id)
    .eq("workspace_id", agent.workspace_id)
    .eq("owner_user_id", user.id)
    .select("id, name")
    .single();

  if (error || !updatedAgent) {
    return {
      ok: false,
      agentId,
      message: error?.message ?? "Failed to rename the agent."
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: updatedAgent.id,
    agentName: updatedAgent.name
  };
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

export async function setDefaultAgent(formData: FormData) {
  const agentId = formData.get("agent_id");
  const redirectThreadId = formData.get("redirect_thread_id");
  const redirectTarget = buildChatRedirectTarget(redirectThreadId);

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "Choose an active agent before setting a default."
      )}`
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
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: activeAgents, error: activeAgentsError } = await supabase
    .from("agents")
    .select("id, metadata")
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (activeAgentsError || !activeAgents) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        activeAgentsError?.message ?? "Failed to load active agents."
      )}`
    );
  }

  if (!activeAgents.some((agent) => agent.id === agentId)) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "The selected default agent is unavailable."
      )}`
    );
  }

  for (const activeAgent of activeAgents) {
    const nextMetadata = { ...(activeAgent.metadata ?? {}) } as Record<string, unknown>;

    if (activeAgent.id === agentId) {
      nextMetadata.is_default_for_workspace = true;
    } else {
      delete nextMetadata.is_default_for_workspace;
    }

    const { error } = await supabase
      .from("agents")
      .update({
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", activeAgent.id)
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", user.id);

    if (error) {
      redirect(
        `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }

  revalidatePath("/chat");
  redirect(redirectTarget);
}

export async function hideMemory(formData: FormData) {
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "The memory to hide could not be determined."
      )}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await supabase
    .from("memory_items")
    .select("id, metadata")
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memoryItem) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "The selected memory is unavailable."
      )}`
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  nextMetadata.is_hidden = true;
  nextMetadata.hidden_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_items")
    .update({
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryItem.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/chat");
  redirect(redirectTarget);
}

export async function restoreMemory(formData: FormData) {
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "The memory to restore could not be determined."
      )}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await supabase
    .from("memory_items")
    .select("id, metadata")
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memoryItem) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        "The selected hidden memory is unavailable."
      )}`
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  delete nextMetadata.is_hidden;
  delete nextMetadata.hidden_at;
  nextMetadata.restored_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_items")
    .update({
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryItem.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `${redirectTarget}${redirectTarget.includes("?") ? "&" : "?"}error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/chat");
  redirect(redirectTarget);
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
    const assistantFailure = classifyAssistantError(error);

    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id,
          error_type: assistantFailure.errorType,
          error_message: assistantFailure.message
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
      message: assistantFailure.message
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
    const assistantFailure = classifyAssistantError(error);

    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          ...failedMessage.metadata,
          error_type: assistantFailure.errorType,
          error_message: assistantFailure.message
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
      message: assistantFailure.message
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId
  };
}

export async function renameThread(
  formData: FormData
): Promise<RenameThreadResult> {
  const threadId = formData.get("thread_id");
  const title = formData.get("title");

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: "The thread to rename could not be determined."
    };
  }

  if (typeof title !== "string") {
    return {
      ok: false,
      threadId,
      message: "Type a title before saving."
    };
  }

  const normalizedTitle = normalizeThreadTitle(title);

  if (!normalizedTitle) {
    return {
      ok: false,
      threadId,
      message: "Type a title before saving."
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

  const { data: thread, error } = await supabase
    .from("threads")
    .update({
      title: normalizedTitle,
      updated_at: new Date().toISOString()
    })
    .eq("id", threadId)
    .eq("owner_user_id", user.id)
    .select("id, title")
    .single();

  if (error || !thread) {
    return {
      ok: false,
      threadId,
      message: error?.message ?? "Failed to rename the thread."
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id,
    title: thread.title
  };
}
