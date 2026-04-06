import type {
  RuntimeEvent,
  RuntimeKnowledgeSelectedEvent,
  RuntimeThreadStateWritebackCompletedEvent,
  RuntimeMemoryRecalledEvent,
  RuntimeMemoryWritePlannedEvent,
  RuntimeAnswerStrategySelectedEvent
} from "@/lib/chat/runtime-contract";

export function getRuntimeMemoryRecalledEvent(
  events: RuntimeEvent[] | null | undefined
): RuntimeMemoryRecalledEvent | null {
  const event = (events ?? []).find(
    (item): item is RuntimeMemoryRecalledEvent => item.type === "memory_recalled"
  );

  return event ?? null;
}

export function getRuntimeMemoryRecordRecallPreferred(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeMemoryRecalledEvent(events)?.payload.memory_record_recall_preferred ??
    null
  );
}

export function getRuntimeProfileFallbackSuppressed(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeMemoryRecalledEvent(events)?.payload.profile_fallback_suppressed ??
    null
  );
}

export function getRuntimeKnowledgeSelectedEvent(
  events: RuntimeEvent[] | null | undefined
): RuntimeKnowledgeSelectedEvent | null {
  const event = (events ?? []).find(
    (item): item is RuntimeKnowledgeSelectedEvent =>
      item.type === "knowledge_selected"
  );

  return event ?? null;
}

export function getRuntimeKnowledgeSuppressed(
  events: RuntimeEvent[] | null | undefined
) {
  return getRuntimeKnowledgeSelectedEvent(events)?.payload.suppressed ?? null;
}

export function getRuntimeKnowledgeAvailable(
  events: RuntimeEvent[] | null | undefined
) {
  return getRuntimeKnowledgeSelectedEvent(events)?.payload.available ?? null;
}

export function getRuntimeKnowledgeAvailableCount(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeKnowledgeSelectedEvent(events)?.payload.available_count ?? null
  );
}

export function getRuntimeKnowledgeShouldInject(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeKnowledgeSelectedEvent(events)?.payload.should_inject ?? null
  );
}

export function getRuntimeKnowledgeInjectionGapReason(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeKnowledgeSelectedEvent(events)?.payload.injection_gap_reason ??
    null
  );
}

export function getRuntimeKnowledgeSuppressionReason(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeKnowledgeSelectedEvent(events)?.payload.suppression_reason ?? null
  );
}

export function getRuntimeKnowledgeWeakMatchFilteredCount(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeKnowledgeSelectedEvent(events)?.payload.weak_match_filtered_count ??
    null
  );
}

export function getRuntimeMemoryWritePlannedEvent(
  events: RuntimeEvent[] | null | undefined
): RuntimeMemoryWritePlannedEvent | null {
  const event = (events ?? []).find(
    (item): item is RuntimeMemoryWritePlannedEvent =>
      item.type === "memory_write_planned"
  );

  return event ?? null;
}

export function getRuntimeAnswerStrategySelectedEvent(
  events: RuntimeEvent[] | null | undefined
): RuntimeAnswerStrategySelectedEvent | null {
  const event = (events ?? []).find(
    (item): item is RuntimeAnswerStrategySelectedEvent =>
      item.type === "answer_strategy_selected"
  );

  return event ?? null;
}

export function getRuntimeAnswerCarryoverPolicy(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeAnswerStrategySelectedEvent(events)?.payload.carryover_policy ??
    null
  );
}

export function getRuntimeAnswerForbiddenMoves(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeAnswerStrategySelectedEvent(events)?.payload.forbidden_moves ?? []
  );
}

export function getRuntimeAnswerSceneGoal(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeAnswerStrategySelectedEvent(events)?.payload.scene_goal ?? null
  );
}

export function getRuntimePlannerCandidateCount(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeMemoryWritePlannedEvent(events)?.payload.planner_candidate_count ??
    null
  );
}

export function getRuntimePlannerRejectedCandidateCount(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeMemoryWritePlannedEvent(events)?.payload.rejected_candidate_count ??
    null
  );
}

export function getRuntimePlannerBoundaryReasonCounts(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeMemoryWritePlannedEvent(events)?.payload.boundary_reason_counts ??
    null
  );
}

export function getRuntimeThreadStateWritebackCompletedEvent(
  events: RuntimeEvent[] | null | undefined
): RuntimeThreadStateWritebackCompletedEvent | null {
  const event = (events ?? []).find(
    (item): item is RuntimeThreadStateWritebackCompletedEvent =>
      item.type === "thread_state_writeback_completed"
  );

  return event ?? null;
}

export function getRuntimeThreadStateWritebackStatus(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeThreadStateWritebackCompletedEvent(events)?.payload.status ?? null
  );
}

export function getRuntimeThreadStateWritebackReason(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeThreadStateWritebackCompletedEvent(events)?.payload.reason ?? null
  );
}

export function getRuntimeThreadStateWritebackAnchorMode(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeThreadStateWritebackCompletedEvent(events)?.payload.anchor_mode ??
    null
  );
}

export function getRuntimeThreadStateWritebackFocusProjectionReason(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeThreadStateWritebackCompletedEvent(events)?.payload
      .focus_projection_reason ?? null
  );
}

export function getRuntimeThreadStateWritebackContinuityProjectionReason(
  events: RuntimeEvent[] | null | undefined
) {
  return (
    getRuntimeThreadStateWritebackCompletedEvent(events)?.payload
      .continuity_projection_reason ?? null
  );
}
