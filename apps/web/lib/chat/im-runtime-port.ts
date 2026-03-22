import {
  type AdapterRuntimeInput,
  type AdapterRuntimeOutput,
  type AdapterRuntimePort
} from "@/lib/integrations/im-adapter";
import { executeMemoryWriteRequests } from "@/lib/chat/memory-write";
import { executeFollowUpRequests } from "@/lib/chat/follow-up-executor";
import { enqueueAcceptedFollowUps } from "@/lib/chat/follow-up-repository";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import { buildRuntimeTurnInputFromAdapterInput } from "@/lib/chat/runtime-input";
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

async function updateAssistantPreviewMetadata(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  updates: Record<string, unknown>;
}) {
  const { data: assistantMessage } = await args.supabase
    .from("messages")
    .select("metadata")
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .maybeSingle();

  await args.supabase
    .from("messages")
    .update({
      metadata: {
        ...(assistantMessage?.metadata ?? {}),
        ...args.updates
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
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

  const runtimeTurnInput = buildRuntimeTurnInputFromAdapterInput({
    input,
    workspaceId: workspace.id,
    context: {
      source_platform: "im"
    }
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
      metadata: {
        source: runtimeTurnInput.message.source,
        runtime_source_timestamp: runtimeTurnInput.message.timestamp,
        adapter_metadata: runtimeTurnInput.message.metadata,
        runtime_turn_input: runtimeTurnInput
      }
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
    await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: input.user_id,
        role: "assistant",
        content: "",
        status: "pending",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id,
          source: input.source
        }
      })
      .select("id")
      .single();

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
      await updateAssistantPreviewMetadata({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        updates: {
          runtime_memory_writes: {
            request_count: runtimeTurnResult.memory_write_requests.length,
            preview: runtimeTurnResult.memory_write_requests.map((request) => ({
              kind: request.kind,
              memory_type: request.memory_type,
              relationship_key:
                request.kind === "relationship_memory"
                  ? request.relationship_key
                  : null,
              confidence: request.confidence,
              source_turn_id: request.source_turn_id,
              dedupe_key: request.dedupe_key
            }))
          },
          runtime_memory_write_request_count:
            runtimeTurnResult.memory_write_requests.length,
          runtime_memory_write_requests_preview:
            runtimeTurnResult.memory_write_requests.map((request) => ({
              kind: request.kind,
              memory_type: request.memory_type,
              relationship_key:
                request.kind === "relationship_memory"
                  ? request.relationship_key
                  : null,
              confidence: request.confidence,
              source_turn_id: request.source_turn_id,
              dedupe_key: request.dedupe_key
            }))
        }
      });
    }

    if (runtimeTurnResult.follow_up_requests.length > 0) {
      await updateAssistantPreviewMetadata({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: input.user_id,
        updates: {
          runtime_follow_up: {
            request_count: runtimeTurnResult.follow_up_requests.length,
            preview: runtimeTurnResult.follow_up_requests.map((request) => ({
              kind: request.kind,
              trigger_at: request.trigger_at,
              reason: request.reason
            }))
          },
          runtime_follow_up_request_count:
            runtimeTurnResult.follow_up_requests.length,
          runtime_follow_up_requests_preview:
            runtimeTurnResult.follow_up_requests.map((request) => ({
              kind: request.kind,
              trigger_at: request.trigger_at,
              reason: request.reason
            }))
        }
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
        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          updates: {
            runtime_memory_writes: {
              write_count:
                memoryWriteOutcome.createdCount + memoryWriteOutcome.updatedCount,
              write_types: Array.from(
                new Set([
                  ...memoryWriteOutcome.createdTypes,
                  ...memoryWriteOutcome.updatedTypes
                ])
              ),
              new_count: memoryWriteOutcome.createdCount,
              updated_count: memoryWriteOutcome.updatedCount
            },
            memory_write_count:
              memoryWriteOutcome.createdCount + memoryWriteOutcome.updatedCount,
            memory_write_types: Array.from(
              new Set([
                ...memoryWriteOutcome.createdTypes,
                ...memoryWriteOutcome.updatedTypes
              ])
            ),
            new_memory_count: memoryWriteOutcome.createdCount,
            updated_memory_count: memoryWriteOutcome.updatedCount
          }
        });
      }

      if (followUpExecutionResults.length > 0) {
        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: input.user_id,
          updates: {
            runtime_follow_up_execution: {
              result_count: followUpExecutionResults.length,
              results_preview: followUpExecutionResults.map((result) => ({
                kind: result.kind,
                status: result.status,
                reason: result.reason,
                trigger_at: result.trigger_at ?? null
              })),
              enqueued_count: followUpEnqueueResult.inserted_count,
              enqueued_records_preview: followUpEnqueueResult.records.map(
                (record) => ({
                  id: record.id,
                  kind: record.kind,
                  status: record.status,
                  trigger_at: record.trigger_at
                })
              )
            },
            follow_up_execution_result_count: followUpExecutionResults.length,
            follow_up_execution_results_preview: followUpExecutionResults.map(
              (result) => ({
                kind: result.kind,
                status: result.status,
                reason: result.reason,
                trigger_at: result.trigger_at ?? null
              })
            ),
            follow_up_enqueued_count: followUpEnqueueResult.inserted_count,
            follow_up_enqueued_records_preview: followUpEnqueueResult.records.map(
              (record) => ({
                id: record.id,
                kind: record.kind,
                status: record.status,
                trigger_at: record.trigger_at
              })
            )
          }
        });
      }
    } catch (memoryError) {
      console.error("IM runtime post-processing failed:", memoryError);
    }

    return runtimeTurnResult;
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
          error_message: assistantFailure.message,
          source: input.source
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", assistantPlaceholder.id)
      .eq("thread_id", thread.id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", input.user_id);

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
