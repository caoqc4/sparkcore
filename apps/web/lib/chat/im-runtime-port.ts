import {
  type AdapterRuntimeInput,
  type AdapterRuntimeOutput,
  type AdapterRuntimePort
} from "@/lib/integrations/im-adapter";
import { executeMemoryWriteRequests } from "@/lib/chat/memory-write";
import { executeFollowUpRequests } from "@/lib/chat/follow-up-executor";
import { enqueueAcceptedFollowUps } from "@/lib/chat/follow-up-repository";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import {
  insertPendingAssistantMessage,
  markAssistantMessageFailed
} from "@/lib/chat/assistant-message-state-persistence";
import {
  updateAssistantFollowUpExecutionPreview,
  updateAssistantFollowUpRequestPreview,
  updateAssistantMemoryWriteOutcomePreview,
  updateAssistantMemoryWriteRequestPreview
} from "@/lib/chat/assistant-preview-metadata";
import { buildImRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { buildRuntimeUserMessageMetadata } from "@/lib/chat/runtime-user-message-metadata";
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
  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      workspace_id: workspace.id,
      user_id: input.user_id,
      role: "user",
      content: trimmedContent,
      metadata: buildRuntimeUserMessageMetadata(runtimeTurnInput)
    })
    .select("id")
    .single();

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

    if (runtimeTurnResult.memory_write_requests.length > 0) {
      await updateAssistantMemoryWriteRequestPreview({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        requests: runtimeTurnResult.memory_write_requests
      });
    }

    if (runtimeTurnResult.follow_up_requests.length > 0) {
      await updateAssistantFollowUpRequestPreview({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        requests: runtimeTurnResult.follow_up_requests
      });
    }

    try {
      const [memoryWriteOutcome, followUpExecutionResults] = await Promise.all([
        executeMemoryWriteRequests({
          workspaceId: workspace.id,
          userId: input.user_id,
          agentId: thread.agent_id,
          requests: runtimeTurnResult.memory_write_requests
        }),
        executeFollowUpRequests({
          requests: runtimeTurnResult.follow_up_requests
        })
      ]);
      const followUpEnqueueResult = await enqueueAcceptedFollowUps({
        workspace_id: workspace.id,
        user_id: input.user_id,
        agent_id: thread.agent_id,
        thread_id: thread.id,
        source_message_id: insertedMessage.id,
        execution_results: followUpExecutionResults,
        repository: createAdminFollowUpRepository()
      });

      if (
        memoryWriteOutcome.createdCount > 0 ||
        memoryWriteOutcome.updatedCount > 0
      ) {
        await updateAssistantMemoryWriteOutcomePreview({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          outcome: memoryWriteOutcome
        });
      }

      if (followUpExecutionResults.length > 0) {
        await updateAssistantFollowUpExecutionPreview({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          execution: {
            followUpExecutionResults,
            followUpEnqueueInsertedCount: followUpEnqueueResult.inserted_count,
            followUpEnqueueRecords: followUpEnqueueResult.records
          }
        });
      }
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
