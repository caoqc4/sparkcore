import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import {
  updateAssistantFollowUpExecutionPreview,
  updateAssistantFollowUpRequestPreview,
  updateAssistantMemoryWriteOutcomePreview,
  updateAssistantMemoryWriteRequestPreview
} from "@/lib/chat/assistant-preview-metadata";
import { executeFollowUpRequests } from "@/lib/chat/follow-up-executor";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import { enqueueAcceptedFollowUps } from "@/lib/chat/follow-up-repository";
import { executeMemoryWriteRequests } from "@/lib/chat/memory-write";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { createAdminThreadStateRepository } from "@/lib/chat/thread-state-admin-repository";

type AssistantPostProcessingTarget = {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
};

export async function persistAssistantRequestPreviews(
  args: AssistantPostProcessingTarget & {
    activeNamespace?: ActiveRuntimeMemoryNamespace | null;
    runtimeTurnResult: Pick<
      RuntimeTurnResult,
      "memory_write_requests" | "follow_up_requests"
    >;
  }
) {
  if (args.runtimeTurnResult.memory_write_requests.length > 0) {
    await updateAssistantMemoryWriteRequestPreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      activeNamespace: args.activeNamespace ?? null,
      requests: args.runtimeTurnResult.memory_write_requests
    });
  }

  if (args.runtimeTurnResult.follow_up_requests.length > 0) {
    await updateAssistantFollowUpRequestPreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      requests: args.runtimeTurnResult.follow_up_requests
    });
  }
}

export async function processAssistantRuntimePostProcessing(
  args: AssistantPostProcessingTarget & {
    agentId: string;
    sourceMessageId: string;
    activeMemoryNamespace?: ActiveRuntimeMemoryNamespace | null;
    runtimeTurnResult: Pick<
      RuntimeTurnResult,
      "memory_write_requests" | "follow_up_requests"
    >;
  }
) {
  const [memoryWriteOutcome, followUpExecutionResults] = await Promise.all([
    executeMemoryWriteRequests({
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      threadId: args.threadId,
      threadStateRepository: createAdminThreadStateRepository(),
      activeNamespace: args.activeMemoryNamespace ?? null,
      requests: args.runtimeTurnResult.memory_write_requests
    }),
    executeFollowUpRequests({
      requests: args.runtimeTurnResult.follow_up_requests
    })
  ]);

  const followUpEnqueueResult = await enqueueAcceptedFollowUps({
    workspace_id: args.workspaceId,
    user_id: args.userId,
    agent_id: args.agentId,
    thread_id: args.threadId,
    source_message_id: args.sourceMessageId,
    execution_results: followUpExecutionResults,
    repository: createAdminFollowUpRepository()
  });

  if (memoryWriteOutcome.createdCount > 0 || memoryWriteOutcome.updatedCount > 0) {
    await updateAssistantMemoryWriteOutcomePreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      outcome: memoryWriteOutcome
    });
  }

  if (followUpExecutionResults.length > 0) {
    await updateAssistantFollowUpExecutionPreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      execution: {
        followUpExecutionResults,
        followUpEnqueueInsertedCount: followUpEnqueueResult.inserted_count,
        followUpEnqueueRecords: followUpEnqueueResult.records
      }
    });
  }
}
