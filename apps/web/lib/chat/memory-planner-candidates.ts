import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { MEMORY_CONFIDENCE_THRESHOLD, type ContextMessage } from "@/lib/chat/memory-shared";
import {
  isDurableMoodCandidate,
  type GenericExtractionCandidate
} from "@/lib/chat/memory-write";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { ProductFeedbackSignal } from "@/lib/chat/product-feedback-incidents";

export type PlannerCandidateTargetLayer =
  | "static_profile"
  | "memory_record"
  | "thread_state_candidate"
  | "event_archive";

export type PlannerCandidateDurability =
  | "durable"
  | "session_or_thread_scoped"
  | "event_only";

export type PlannerCandidateSourceKind =
  | "generic_memory_request"
  | "relationship_memory_request"
  | "generic_memory_extraction"
  | "negative_product_feedback_signal";

export type PlannerCandidateDecisionKind =
  | "create_or_update_memory"
  | "capture_event"
  | "reject_candidate";

export type PlannerCandidatePreview = {
  candidate_id: string;
  decision_kind: PlannerCandidateDecisionKind;
  source_kind: PlannerCandidateSourceKind;
  decision_reason: string | null;
  downgrade_reason: string | null;
  rejection_reason: string | null;
  target_layer: PlannerCandidateTargetLayer;
  durability: PlannerCandidateDurability;
  canonical_memory_type: string | null;
  memory_type: string | null;
  content: string;
  reason: string | null;
  confidence: number | null;
  source_turn_id: string | null;
  record_target: string | null;
  write_boundary: string | null;
  boundary_reason: string | null;
  write_priority_layer: string | null;
  routed_scope: string | null;
  routed_target_agent_id: string | null;
  routed_target_thread_id: string | null;
  routed_project_id: string | null;
  routed_world_id: string | null;
  relationship_key: string | null;
  semantic_source: string | null;
  signal_category: string | null;
  assistant_message_id: string | null;
};

export type PlannerCandidateSummary = {
  candidate_count: number;
  rejected_candidate_count: number;
  downgraded_candidate_count: number;
  decision_kind_counts: Record<string, number>;
  target_layer_counts: Record<string, number>;
  boundary_reason_counts: Record<string, number>;
  decision_reason_counts: Record<string, number>;
  downgrade_reason_counts: Record<string, number>;
  rejection_reason_counts: Record<string, number>;
};

function buildCountMap(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
}

function resolvePlannerCandidateDurability(
  targetLayer: PlannerCandidateTargetLayer
): PlannerCandidateDurability {
  switch (targetLayer) {
    case "thread_state_candidate":
      return "session_or_thread_scoped";
    case "event_archive":
      return "event_only";
    case "static_profile":
    case "memory_record":
    default:
      return "durable";
  }
}

function resolvePlannerCandidateBoundaryReason(args: {
  target: ReturnType<typeof resolvePlannedMemoryWriteTarget>;
}) {
  const { target } = args;

  if (target.writeBoundary === "thread") {
    if (
      target.recordTarget === "static_profile" &&
      target.routedScope === "thread_local"
    ) {
      return "thread_boundary_localized_static_profile";
    }

    if (
      target.recordTarget === "memory_record" &&
      target.routedScope === "thread_local"
    ) {
      return "thread_boundary_localized_memory_record";
    }

    if (target.recordTarget === "thread_state_candidate") {
      return "thread_boundary_preserved_thread_state_candidate";
    }

    return "thread_boundary_applied";
  }

  if (target.writeBoundary === "project") {
    if (
      target.recordTarget === "thread_state_candidate" &&
      target.routedScope === "thread_local"
    ) {
      return "project_boundary_preserved_thread_state_candidate";
    }

    return target.routedProjectId ? "project_boundary_applied" : null;
  }

  if (target.writeBoundary === "world") {
    if (
      target.recordTarget === "thread_state_candidate" &&
      target.routedScope === "thread_local"
    ) {
      return "world_boundary_preserved_thread_state_candidate";
    }

    return target.routedWorldId ? "world_boundary_applied" : null;
  }

  return null;
}

function resolvePlannerCandidateTargetLayer(args: {
  request: RuntimeMemoryWriteRequest;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
}): PlannerCandidateTargetLayer {
  const target = resolvePlannedMemoryWriteTarget(
    args.request,
    args.activeNamespace ?? null
  );

  return target.recordTarget;
}

function resolvePlannerCandidateDecisionReason(args: {
  request: RuntimeMemoryWriteRequest;
  targetLayer: PlannerCandidateTargetLayer;
}) {
  if (args.request.kind === "relationship_memory") {
    return "explicit_relationship_contract";
  }

  if (
    args.request.kind === "generic_memory" &&
    args.request.memory_type === "goal" &&
    args.targetLayer === "thread_state_candidate"
  ) {
    return "goal_focus_projection";
  }

  if (args.targetLayer === "static_profile") {
    return "static_profile_preferred";
  }

  return "generic_memory_request_accepted";
}

function resolvePlannerCandidateDowngradeReason(args: {
  request: RuntimeMemoryWriteRequest;
  targetLayer: PlannerCandidateTargetLayer;
}) {
  if (
    args.request.kind === "generic_memory" &&
    args.request.memory_type === "profile" &&
    args.targetLayer === "static_profile"
  ) {
    return "profile_routed_to_static_profile";
  }

  if (
    args.request.kind === "generic_memory" &&
    args.request.memory_type === "preference" &&
    args.targetLayer === "static_profile"
  ) {
    return "preference_routed_to_static_profile";
  }

  if (
    args.request.kind === "generic_memory" &&
    args.request.memory_type === "goal" &&
    args.targetLayer === "thread_state_candidate"
  ) {
    return "goal_routed_to_thread_state_candidate";
  }

  return null;
}

export function buildPlannerCandidatePreviewFromWriteRequest(args: {
  request: RuntimeMemoryWriteRequest;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
}): PlannerCandidatePreview {
  const target = resolvePlannedMemoryWriteTarget(
    args.request,
    args.activeNamespace ?? null
  );
  const targetLayer = resolvePlannerCandidateTargetLayer(args);

  return {
    candidate_id:
      args.request.dedupe_key ??
      `${args.request.kind}:${args.request.memory_type}:${args.request.source_turn_id}`,
    decision_kind: "create_or_update_memory",
    source_kind:
      args.request.kind === "relationship_memory"
        ? "relationship_memory_request"
        : "generic_memory_request",
    decision_reason: resolvePlannerCandidateDecisionReason({
      request: args.request,
      targetLayer
    }),
    downgrade_reason: resolvePlannerCandidateDowngradeReason({
      request: args.request,
      targetLayer
    }),
    rejection_reason: null,
    target_layer: targetLayer,
    durability: resolvePlannerCandidateDurability(targetLayer),
    canonical_memory_type: target.canonicalMemoryType,
    memory_type: args.request.memory_type,
    content: args.request.candidate_content,
    reason: args.request.reason ?? null,
    confidence: args.request.confidence ?? null,
    source_turn_id: args.request.source_turn_id ?? null,
    record_target: target.recordTarget,
    write_boundary: target.writeBoundary,
    boundary_reason: resolvePlannerCandidateBoundaryReason({ target }),
    write_priority_layer: target.writePriorityLayer,
    routed_scope: target.routedScope,
    routed_target_agent_id: target.routedTargetAgentId,
    routed_target_thread_id: target.routedTargetThreadId,
    routed_project_id: target.routedProjectId,
    routed_world_id: target.routedWorldId,
    relationship_key:
      args.request.kind === "relationship_memory"
        ? args.request.relationship_key
        : null,
    semantic_source:
      target.recordTarget === "thread_state_candidate"
        ? "goal_memory_candidate"
        : null,
    signal_category: null,
    assistant_message_id: null
  };
}

export function buildPlannerCandidatePreviewsFromWriteRequests(args: {
  requests: RuntimeMemoryWriteRequest[];
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
}) {
  return args.requests.map((request) =>
    buildPlannerCandidatePreviewFromWriteRequest({
      request,
      activeNamespace: args.activeNamespace ?? null
    })
  );
}

export function summarizePlannerCandidates(
  candidates: PlannerCandidatePreview[]
): PlannerCandidateSummary {
  return {
    candidate_count: candidates.length,
    rejected_candidate_count: candidates.filter(
      (candidate) => candidate.decision_kind === "reject_candidate"
    ).length,
    downgraded_candidate_count: candidates.filter(
      (candidate) =>
        typeof candidate.downgrade_reason === "string" &&
        candidate.downgrade_reason.length > 0
    ).length,
    decision_kind_counts: buildCountMap(
      candidates.map((candidate) => candidate.decision_kind)
    ),
    target_layer_counts: buildCountMap(
      candidates.map((candidate) => candidate.target_layer)
    ),
    boundary_reason_counts: buildCountMap(
      candidates.map((candidate) => candidate.boundary_reason)
    ),
    decision_reason_counts: buildCountMap(
      candidates.map((candidate) => candidate.decision_reason)
    ),
    downgrade_reason_counts: buildCountMap(
      candidates.map((candidate) => candidate.downgrade_reason)
    ),
    rejection_reason_counts: buildCountMap(
      candidates.map((candidate) => candidate.rejection_reason)
    )
  };
}

export function buildPlannerCandidatePreviewFromProductFeedbackSignal(args: {
  signal: ProductFeedbackSignal;
  latestUserMessage: string;
  sourceMessageId: string;
  assistantMessageId: string | null;
}) {
  if (!args.signal.detected) {
    return null;
  }

  return {
    candidate_id: `event:negative_product_feedback:${args.sourceMessageId}`,
    decision_kind: "capture_event" as const,
    source_kind: "negative_product_feedback_signal" as const,
    decision_reason: "negative_product_feedback_event_only" as const,
    downgrade_reason: null,
    rejection_reason: null,
    target_layer: "event_archive" as const,
    durability: "event_only" as const,
    canonical_memory_type: null,
    memory_type: null,
    content: args.latestUserMessage,
    reason: args.signal.reason ?? null,
    confidence:
      args.signal.confidence === "high"
        ? 0.95
        : args.signal.confidence === "medium"
          ? 0.8
          : args.signal.confidence === "low"
            ? 0.65
            : null,
    source_turn_id: args.sourceMessageId,
    record_target: null,
    write_boundary: null,
    boundary_reason: null,
    write_priority_layer: null,
    routed_scope: null,
    routed_target_agent_id: null,
    routed_target_thread_id: null,
    routed_project_id: null,
    routed_world_id: null,
    relationship_key: null,
    semantic_source: "negative_product_feedback_signal",
    signal_category: args.signal.category,
    assistant_message_id: args.assistantMessageId
  };
}

export function buildPlannerCandidatePreviewFromGenericExtraction(args: {
  candidate: GenericExtractionCandidate;
  latestUserMessage: string;
  recentContext: ContextMessage[];
  sourceTurnId: string | null;
}) {
  const moodDurable = isDurableMoodCandidate({
    candidate: args.candidate,
    latestUserMessage: args.latestUserMessage,
    recentContext: args.recentContext
  });
  const shouldRejectMood =
    args.candidate.memory_type === "mood" && moodDurable === false;
  const shouldRejectByStore = args.candidate.should_store !== true;
  const shouldRejectByConfidence =
    args.candidate.confidence < MEMORY_CONFIDENCE_THRESHOLD;
  const decisionKind =
    shouldRejectMood || shouldRejectByStore || shouldRejectByConfidence
      ? ("reject_candidate" as const)
      : ("create_or_update_memory" as const);
  const rejectionReason = shouldRejectByStore
    ? "extractor_marked_not_storable"
    : shouldRejectByConfidence
      ? "below_confidence_threshold"
      : shouldRejectMood
        ? "transient_mood_rejected"
        : null;
  const semanticSource = shouldRejectByStore
    ? "extractor_should_store_false"
    : shouldRejectByConfidence
      ? "extractor_confidence_gate"
      : shouldRejectMood
        ? "mood_durability_gate"
        : "generic_memory_extraction";

  return {
    candidate_id: `generic-extraction:${args.candidate.memory_type}:${args.sourceTurnId ?? "unknown"}`,
    decision_kind: decisionKind,
    source_kind: "generic_memory_extraction" as const,
    decision_reason: decisionKind === "reject_candidate"
      ? null
      : "generic_memory_extraction_accepted",
    downgrade_reason: null,
    rejection_reason: rejectionReason,
    target_layer: "memory_record" as const,
    durability:
      decisionKind === "reject_candidate"
        ? ("event_only" as const)
        : ("durable" as const),
    canonical_memory_type: args.candidate.memory_type,
    memory_type: args.candidate.memory_type,
    content: args.candidate.content,
    reason: args.candidate.reason ?? null,
    confidence: args.candidate.confidence ?? null,
    source_turn_id: args.sourceTurnId,
    record_target: shouldRejectMood ? null : "memory_record",
    write_boundary: null,
    boundary_reason: null,
    write_priority_layer: null,
    routed_scope: null,
    routed_target_agent_id: null,
    routed_target_thread_id: null,
    routed_project_id: null,
    routed_world_id: null,
    relationship_key: null,
    semantic_source: semanticSource,
    signal_category: null,
    assistant_message_id: null
  };
}
