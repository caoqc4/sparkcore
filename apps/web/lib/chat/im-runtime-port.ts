import {
  type AdapterRuntimeInput,
  type AdapterRuntimeOutput,
  type AdapterRuntimePort
} from "@/lib/integrations/im-adapter";
import {
  insertPendingAssistantMessage,
  markAssistantMessageFailed
} from "@/lib/chat/assistant-message-state-persistence";
import {
  persistAssistantRequestPreviews,
  processAssistantRuntimePostProcessing
} from "@/lib/chat/runtime-turn-post-processing";
import { buildImRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { insertRuntimeUserMessage } from "@/lib/chat/runtime-user-message-persistence";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import { runAgentTurn } from "@/lib/chat/runtime";
import { LiteLLMError, LiteLLMTimeoutError } from "@/lib/litellm/client";
import { createAdminClient } from "@/lib/supabase/admin";

type AssistantErrorType = "timeout" | "provider_error" | "generation_failed";

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
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

async function runImRuntimeTurnWithSupabase(args: {
  supabase: any;
  input: AdapterRuntimeInput;
}): Promise<AdapterRuntimeOutput> {
  const { supabase, input } = args;

  if (!input.thread_id || input.thread_id.trim().length === 0) {
    throw new Error("IM runtime input requires a resolved thread_id.");
  }
  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, workspace_id, created_at, updated_at")
    .eq("id", input.thread_id)
    .eq("owner_user_id", input.user_id)
    .maybeSingle();

  if (!thread) {
    throw new Error("The requested thread could not be loaded for IM runtime.");
  }

  if (!thread.agent_id) {
    throw new Error("The requested thread is not bound to an agent.");
  }

  if (thread.agent_id !== input.agent_id) {
    throw new Error("Thread agent binding does not match adapter runtime input.");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("id", thread.workspace_id)
    .eq("owner_user_id", input.user_id)
    .maybeSingle();

  if (!workspace) {
    throw new Error("The workspace for the IM runtime turn could not be loaded.");
  }

  const roleResolution = await resolveRoleProfile({
    repository: new SupabaseRoleRepository(supabase),
    workspaceId: workspace.id,
    userId: input.user_id,
    requestedAgentId: input.agent_id
  });

  if (roleResolution.status !== "resolved") {
    throw new Error("The bound agent for the IM runtime turn could not be loaded.");
  }
  const agent = roleResolution.role;

  const runtimeTurnInput = buildImRuntimeTurnInput({
    input,
    workspaceId: workspace.id
  });
  const trimmedContent = runtimeTurnInput.message.content.trim();
  const { data: insertedMessage, error: insertError } = await insertRuntimeUserMessage({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: input.user_id,
    content: trimmedContent,
    runtimeTurnInput
  });

  if (insertError || !insertedMessage) {
    throw new Error(insertError?.message ?? "Failed to store inbound IM user message.");
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
    .eq("owner_user_id", input.user_id);

  const { data: persistedMessages, error: persistedMessagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (persistedMessagesError) {
    throw new Error(persistedMessagesError.message);
  }

  const { data: assistantPlaceholder, error: assistantPlaceholderError } =
    await insertPendingAssistantMessage({
      supabase,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      agentId: thread.agent_id,
      userMessageId: insertedMessage.id,
      source: input.source
    });

  if (assistantPlaceholderError || !assistantPlaceholder) {
    throw new Error(
      assistantPlaceholderError?.message ??
        "Failed to initialize the IM assistant reply placeholder."
    );
  }

  try {
    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput,
      supabase,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id
      },
      agent,
      messages: (persistedMessages ?? []) as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        status: string;
        metadata: Record<string, unknown>;
        created_at: string;
      }>,
      assistantMessageId: assistantPlaceholder.id
    });

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime completed without an assistant message.");
    }

    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      runtimeTurnResult
    });

    try {
      await processAssistantRuntimePostProcessing({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        agentId: thread.agent_id,
        sourceMessageId: insertedMessage.id,
        runtimeTurnResult
      });
    } catch (memoryError) {
      console.error("IM runtime post-processing failed:", memoryError);
    }

    return runtimeTurnResult;
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: input.user_id,
      agentId: thread.agent_id,
      userMessageId: insertedMessage.id,
      source: input.source,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

    throw error;
  }
}

export async function runImRuntimeTurn(
  input: AdapterRuntimeInput
): Promise<AdapterRuntimeOutput> {
  const supabase = createAdminClient();
  return runImRuntimeTurnWithSupabase({
    supabase,
    input
  });
}

export function createWebImRuntimePort(): AdapterRuntimePort {
  return {
    runTurn: runImRuntimeTurn
  };
}

export const webImRuntimePort: AdapterRuntimePort = createWebImRuntimePort();
