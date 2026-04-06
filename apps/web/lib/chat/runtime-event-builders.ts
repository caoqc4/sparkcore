import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import type {
  BuildAnswerStrategySelectedEventArgs,
  BuildAssistantReplyCompletedEventArgs,
  BuildFollowUpPlannedEventArgs,
  BuildKnowledgeSelectedEventArgs,
  BuildMemoryRecalledEventArgs,
  BuildMemoryWritePlannedEventArgs,
  BuildThreadStateWritebackCompletedEventArgs
} from "@/lib/chat/runtime-contract";

export function buildKnowledgeSelectedEvent(args: BuildKnowledgeSelectedEventArgs) {
  return {
    type: "knowledge_selected" as const,
    payload: {
      count: args.applicableKnowledgeCount,
      knowledge_route: args.knowledgeGating.knowledge_route,
      available: args.knowledgeGating.available,
      available_count: args.knowledgeGating.available_count,
      should_inject: args.knowledgeGating.should_inject,
      injection_gap_reason: args.knowledgeGating.injection_gap_reason,
      suppressed: args.knowledgeGating.suppressed,
      suppression_reason: args.knowledgeGating.suppression_reason,
      query_token_count: args.knowledgeGating.query_token_count,
      zero_match_filtered_count:
        args.knowledgeGating.zero_match_filtered_count ?? 0,
      weak_match_filtered_count:
        args.knowledgeGating.weak_match_filtered_count ?? 0
    }
  };
}

export function buildMemoryRecalledEvent(args: BuildMemoryRecalledEventArgs) {
  return {
    type: "memory_recalled" as const,
    payload: {
      count: args.recalledCount,
      memory_types: args.memoryTypes,
      hidden_exclusion_count: args.hiddenExclusionCount,
      incorrect_exclusion_count: args.incorrectExclusionCount,
      memory_record_recall_preferred: args.memoryRecordRecallPreferred,
      profile_fallback_suppressed: args.profileFallbackSuppressed
    }
  };
}

export function buildMemoryWritePlannedEvent(args: BuildMemoryWritePlannedEventArgs) {
  return {
    type: "memory_write_planned" as const,
    payload: {
      count: args.memoryWriteRequests.length,
      planner_candidate_count: args.memoryPlannerSummary.candidate_count,
      rejected_candidate_count:
        args.memoryPlannerSummary.rejected_candidate_count,
      downgraded_candidate_count:
        args.memoryPlannerSummary.downgraded_candidate_count,
      memory_types: Array.from(
        new Set(args.memoryWriteRequests.map((request) => request.memory_type))
      ),
      record_targets: Array.from(
        new Set(
          args.memoryWriteRequests.map(
            (request) =>
              resolvePlannedMemoryWriteTarget(
                request as never,
                args.activeMemoryNamespace as never
              ).recordTarget
          )
        )
      ),
      write_boundaries: Array.from(
        new Set(
          args.memoryWriteRequests.map(
            (request) =>
              resolvePlannedMemoryWriteTarget(
                request as never,
                args.activeMemoryNamespace as never
              ).writeBoundary
          )
        )
      ),
      decision_kind_counts: args.memoryPlannerSummary.decision_kind_counts,
      target_layer_counts: args.memoryPlannerSummary.target_layer_counts,
      boundary_reason_counts: args.memoryPlannerSummary.boundary_reason_counts,
      decision_reason_counts: args.memoryPlannerSummary.decision_reason_counts,
      downgrade_reason_counts: args.memoryPlannerSummary.downgrade_reason_counts,
      rejection_reason_counts: args.memoryPlannerSummary.rejection_reason_counts
    }
  };
}

export function buildFollowUpPlannedEvent(args: BuildFollowUpPlannedEventArgs) {
  return {
    type: "follow_up_planned" as const,
    payload: {
      count: args.followUpRequests.length,
      kinds: Array.from(new Set(args.followUpRequests.map((request) => request.kind)))
    }
  };
}

export function buildAnswerStrategySelectedEvent(
  args: BuildAnswerStrategySelectedEventArgs
) {
  return {
    type: "answer_strategy_selected" as const,
    payload: {
      question_type: args.questionType,
      strategy: args.strategy,
      reason_code: args.reasonCode,
      priority: args.priority,
      carryover_policy: args.carryoverPolicy,
      forbidden_moves: args.forbiddenMoves,
      scene_goal: args.sceneGoal,
      continuation_reason_code: args.continuationReasonCode,
      reply_language: args.replyLanguage
    }
  };
}

export function buildAssistantReplyCompletedEvent(
  args: BuildAssistantReplyCompletedEventArgs
) {
  return {
    type: "assistant_reply_completed" as const,
    payload: {
      thread_id: args.threadId,
      agent_id: args.agentId,
      recalled_count: args.recalledCount,
      message_type: "text" as const,
      language: args.replyLanguage
    }
  };
}

export function buildThreadStateWritebackCompletedEvent(
  args: BuildThreadStateWritebackCompletedEventArgs
) {
  return {
    type: "thread_state_writeback_completed" as const,
    payload: {
      status: args.status,
      repository: args.repository,
      anchor_mode: args.status === "written" ? (args.anchorMode ?? null) : null,
      focus_projection_reason:
        args.status === "written" ? (args.focusProjectionReason ?? null) : null,
      continuity_projection_reason:
        args.status === "written"
          ? (args.continuityProjectionReason ?? null)
          : null,
      reason: args.status === "written" ? null : (args.reason ?? null)
    }
  };
}
