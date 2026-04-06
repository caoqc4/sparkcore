import type {
  RuntimeDeferredPostProcessingPayload,
  RuntimePreviewAssistantMetadata
} from "@/lib/chat/runtime-contract";
import {
  updateAssistantFollowUpExecutionPreview,
  updateAssistantMemoryUsagePreview,
  updateAssistantFollowUpRequestPreview,
  updateAssistantMemoryWriteOutcomePreview,
  updateAssistantMemoryWriteRequestPreview
} from "@/lib/chat/assistant-preview-metadata";
import { executeFollowUpRequests } from "@/lib/chat/follow-up-executor";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import { enqueueAcceptedFollowUps } from "@/lib/chat/follow-up-repository";
import { executeMemoryWriteRequests } from "@/lib/chat/memory-write";
import {
  captureNegativeProductFeedbackIncident,
  detectNegativeProductFeedbackSignal
} from "@/lib/chat/product-feedback-incidents";
import { updateMemoryItems } from "@/lib/chat/memory-item-persistence";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { loadScopedMessageById } from "@/lib/chat/message-read";
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
    runtimeTurnResult: RuntimeDeferredPostProcessingPayload;
  }
) {
  if (
    args.runtimeTurnResult.memory_write_requests.length > 0 ||
    (args.runtimeTurnResult.memory_planner_candidates?.length ?? 0) > 0
  ) {
    await updateAssistantMemoryWriteRequestPreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      activeNamespace: args.activeNamespace ?? null,
      requests: args.runtimeTurnResult.memory_write_requests,
      extraPlannerCandidates:
        args.runtimeTurnResult.memory_planner_candidates ?? []
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
    runtimeTurnResult: RuntimeDeferredPostProcessingPayload;
  }
) {
  const memoryUsageUpdates = args.runtimeTurnResult.memory_usage_updates ?? [];
  const usedRelationshipMemoryIds = Array.from(
    new Set(
      memoryUsageUpdates
        .filter((update) => update.usage_kind === "relationship_recall")
        .map((update) => update.memory_item_id)
        .filter((id) => typeof id === "string" && id.length > 0)
    )
  );

  // Internal processing consumes centrally planned requests only. It may validate
  // or execute them, but must not derive a parallel post-turn strategy here.
  const [memoryWriteOutcome, followUpExecutionResults, usageUpdateResult] =
    await Promise.all([
      executeMemoryWriteRequests({
        supabase: args.supabase,
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
      }),
      updateMemoryItems({
        supabase: args.supabase,
        memoryItemIds: usedRelationshipMemoryIds,
        patch: {
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
    ]);

  if (usageUpdateResult?.error) {
    throw new Error(
      `Failed to update recalled memory freshness: ${usageUpdateResult.error.message}`
    );
  }

  const followUpEnqueueResult = await enqueueAcceptedFollowUps({
    workspace_id: args.workspaceId,
    user_id: args.userId,
    agent_id: args.agentId,
    thread_id: args.threadId,
    source_message_id: args.sourceMessageId,
    execution_results: followUpExecutionResults,
    repository: createAdminFollowUpRepository()
  });

  const [{ data: sourceMessage }, { data: assistantMessage }] = await Promise.all([
    loadScopedMessageById({
      supabase: args.supabase,
      messageId: args.sourceMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      select: "id, role, content, created_at"
    }),
    loadScopedMessageById({
      supabase: args.supabase,
      messageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      select: "id, role, content, created_at, metadata"
    })
  ]);

  if (
    sourceMessage?.role === "user" &&
    assistantMessage?.role === "assistant" &&
    typeof sourceMessage.content === "string" &&
    typeof assistantMessage.content === "string"
  ) {
    const productFeedbackSignal = detectNegativeProductFeedbackSignal(
      sourceMessage.content
    );

    if (productFeedbackSignal.detected) {
      await captureNegativeProductFeedbackIncident({
        supabase: args.supabase,
        workspaceId: args.workspaceId,
        userId: args.userId,
        agentId: args.agentId,
        threadId: args.threadId,
        sourceMessageId: args.sourceMessageId,
        assistantMessageId: args.assistantMessageId,
        latestUserMessage: sourceMessage.content,
        assistantReply: assistantMessage.content,
        signal: productFeedbackSignal
      });
    }
  }

  if (memoryWriteOutcome.createdCount > 0 || memoryWriteOutcome.updatedCount > 0) {
    await updateAssistantMemoryWriteOutcomePreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      outcome: {
        outcome: memoryWriteOutcome
      }
    });
  }

  if (memoryUsageUpdates.length > 0) {
    await updateAssistantMemoryUsagePreview({
      supabase: args.supabase,
      assistantMessageId: args.assistantMessageId,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      usage: {
        updates: memoryUsageUpdates,
        assistantMetadata:
          assistantMessage?.metadata &&
          typeof assistantMessage.metadata === "object" &&
          !Array.isArray(assistantMessage.metadata)
            ? (assistantMessage.metadata as RuntimePreviewAssistantMetadata)
            : null
      }
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
