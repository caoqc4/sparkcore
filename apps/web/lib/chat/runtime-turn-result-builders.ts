import { buildRuntimeAssistantPayload } from "@/lib/chat/assistant-message-payload";
import {
  buildAnswerStrategySelectedEvent,
  buildAssistantReplyCompletedEvent,
  buildFollowUpPlannedEvent,
  buildKnowledgeSelectedEvent,
  buildMemoryRecalledEvent,
  buildMemoryWritePlannedEvent
} from "@/lib/chat/runtime-event-builders";
import type {
  BuildRuntimeTurnResultArtifactsArgs,
  RuntimeTurnResultArtifacts,
  RuntimeTurnResult
} from "@/lib/chat/runtime-contract";

export function buildRuntimeTurnResultArtifacts(
  args: BuildRuntimeTurnResultArtifactsArgs
): RuntimeTurnResultArtifacts {
  const assistantPayload = buildRuntimeAssistantPayload({
    content: args.finalAssistantContent,
    metadata: args.assistantMetadata
  });
  const assistantPayloadContentBytes = Buffer.byteLength(
    assistantPayload.content,
    "utf8"
  );
  const assistantPayloadMetadataBytes = Buffer.byteLength(
    JSON.stringify(assistantPayload.metadata),
    "utf8"
  );
  const assistantPayloadTotalBytes =
    assistantPayloadContentBytes + assistantPayloadMetadataBytes;

  const runtimeTurnResult: RuntimeTurnResult = {
    assistant_message: {
      role: "assistant",
      content: args.finalAssistantContent,
      language: args.replyLanguage,
      message_type: "text",
      metadata: assistantPayload.metadata
    },
    memory_write_requests: args.memoryWriteRequests,
    memory_planner_candidates: args.memoryPlannerCandidates,
    follow_up_requests: args.followUpRequests,
    memory_usage_updates: args.relationshipMemories.map((memory) => ({
      memory_item_id: memory.memory_id,
      usage_kind: "relationship_recall"
    })),
    runtime_events: [
      buildKnowledgeSelectedEvent({
        applicableKnowledgeCount: args.applicableKnowledge.length,
        knowledgeGating: args.knowledgeGatingWithOutcome
      }),
      buildMemoryRecalledEvent({
        recalledCount: args.allRecalledMemories.length,
        memoryTypes:
          args.relationshipMemories.length > 0
            ? Array.from(
                new Set([
                  ...args.memoryRecall.usedMemoryTypes,
                  "relationship" as const
                ])
              )
            : args.memoryRecall.usedMemoryTypes,
        hiddenExclusionCount: args.memoryRecall.hiddenExclusionCount,
        incorrectExclusionCount: args.memoryRecall.incorrectExclusionCount,
        memoryRecordRecallPreferred:
          args.memoryRecall.memoryRecordRecallPreferred === true,
        profileFallbackSuppressed:
          args.memoryRecall.profileFallbackSuppressed === true
      }),
      buildMemoryWritePlannedEvent({
        memoryWriteRequests: args.memoryWriteRequests,
        activeMemoryNamespace: args.activeMemoryNamespace,
        memoryPlannerSummary: args.memoryPlannerSummary
      }),
      buildFollowUpPlannedEvent({
        followUpRequests: args.followUpRequests
      }),
      buildAnswerStrategySelectedEvent({
        questionType: args.answerQuestionType,
        strategy: args.answerStrategy,
        reasonCode: args.answerStrategyReasonCode,
        priority: args.answerStrategyPriority,
        carryoverPolicy: args.answerCarryoverPolicy,
        forbiddenMoves: args.answerForbiddenMoves,
        sceneGoal: args.answerSceneGoal,
        continuationReasonCode: args.continuationReasonCode,
        replyLanguage: args.replyLanguage
      }),
      buildAssistantReplyCompletedEvent({
        threadId: args.threadId,
        agentId: args.agentId,
        recalledCount: args.allRecalledMemories.length,
        replyLanguage: args.replyLanguage
      })
    ],
    debug_metadata: args.debugMetadata
  };

  return {
    assistantPayload,
    assistantPayloadContentBytes,
    assistantPayloadMetadataBytes,
    assistantPayloadTotalBytes,
    runtimeTurnResult
  };
}
