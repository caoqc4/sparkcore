import type {
  RuntimeMemoryUsageUpdate,
  RuntimeFollowUpRequest,
  RuntimeMemoryWriteRequest
} from "@/lib/chat/runtime-contract";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import {
  buildPlannerCandidatePreviewsFromWriteRequests,
  summarizePlannerCandidates,
  type PlannerCandidatePreview
} from "@/lib/chat/memory-planner-candidates";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import { buildPlannedThreadStateCandidatePreview } from "@/lib/chat/memory-write-record-candidates";

type MemoryWriteOutcome = {
  createdCount: number;
  updatedCount: number;
  createdTypes: string[];
  updatedTypes: string[];
};

type FollowUpExecutionResult = {
  kind: string;
  status: string;
  reason?: string | null;
  trigger_at?: string | null;
};

type FollowUpEnqueueRecord = {
  id: string;
  kind: string;
  status: string;
  trigger_at: string;
};

export function getRuntimePreviewMetadataObject(
  value: unknown
): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getRuntimePreviewMetadataGroup(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  return getRuntimePreviewMetadataObject(metadata?.[key]);
}

function buildRuntimeMemoryWriteRequestPreview(
  requests: RuntimeMemoryWriteRequest[],
  activeNamespace?: ActiveRuntimeMemoryNamespace | null
) {
  return requests.map((request) => {
    const target = resolvePlannedMemoryWriteTarget(request, activeNamespace);

    return {
      kind: request.kind,
      memory_type: request.memory_type,
      record_target: target.recordTarget,
      canonical_memory_type: target.canonicalMemoryType,
      write_boundary: target.writeBoundary,
      write_priority_layer: target.writePriorityLayer,
      fallback_write_boundary: target.fallbackWriteBoundary,
      write_escalation_mode: target.writeEscalationMode,
      routed_scope: target.routedScope,
      routed_target_agent_id: target.routedTargetAgentId,
      routed_target_thread_id: target.routedTargetThreadId,
      routed_project_id: target.routedProjectId,
      routed_world_id: target.routedWorldId,
      namespace_primary_layer: target.namespacePrimaryLayer,
      target_namespace_id: target.targetNamespaceId,
      namespace_policy_bundle_id: target.namespacePolicyBundleId,
      namespace_governance_convergence_digest_id:
        target.namespaceGovernanceConvergenceDigestId,
      namespace_governance_convergence_summary:
        target.namespaceGovernanceConvergenceSummary,
      namespace_unified_governance_runtime_digest_id:
        target.namespaceUnifiedGovernanceRuntimeDigestId,
      namespace_unified_governance_runtime_summary:
        target.namespaceUnifiedGovernanceRuntimeSummary,
      namespace_unified_runtime_alignment_mode:
        target.namespaceUnifiedRuntimeAlignmentMode,
      namespace_unified_runtime_reuse_mode:
        target.namespaceUnifiedRuntimeReuseMode,
      namespace_governance_consolidation_digest_id:
        target.namespaceGovernanceConsolidationDigestId,
      namespace_governance_consolidation_summary:
        target.namespaceGovernanceConsolidationSummary,
      namespace_runtime_consolidation_mode:
        target.namespaceRuntimeConsolidationMode,
      namespace_unified_governance_consolidation_digest_id:
        target.namespaceUnifiedGovernanceConsolidationDigestId,
      namespace_unified_governance_consolidation_summary:
        target.namespaceUnifiedGovernanceConsolidationSummary,
      namespace_unified_consolidation_alignment_mode:
        target.namespaceUnifiedConsolidationAlignmentMode,
      namespace_unified_consolidation_reuse_mode:
        target.namespaceUnifiedConsolidationReuseMode,
      namespace_unified_consolidation_coordination_summary:
        target.namespaceUnifiedConsolidationCoordinationSummary,
      namespace_unified_consolidation_consistency_mode:
        target.namespaceUnifiedConsolidationConsistencyMode,
      namespace_governance_plane_runtime_digest_id:
        target.namespaceGovernancePlaneRuntimeDigestId,
      namespace_governance_plane_runtime_summary:
        target.namespaceGovernancePlaneRuntimeSummary,
      namespace_governance_plane_alignment_mode:
        target.namespaceGovernancePlaneAlignmentMode,
      namespace_governance_plane_reuse_mode:
        target.namespaceGovernancePlaneReuseMode,
      namespace_governance_fabric_runtime_digest_id:
        target.namespaceGovernanceFabricRuntimeDigestId,
      namespace_governance_fabric_runtime_summary:
        target.namespaceGovernanceFabricRuntimeSummary,
      namespace_governance_fabric_alignment_mode:
        target.namespaceGovernanceFabricAlignmentMode,
      namespace_governance_fabric_reuse_mode:
        target.namespaceGovernanceFabricReuseMode,
      namespace_governance_fabric_plane_digest_id:
        target.namespaceGovernanceFabricPlaneDigestId,
      namespace_governance_fabric_plane_summary:
        target.namespaceGovernanceFabricPlaneSummary,
      namespace_governance_fabric_plane_alignment_mode:
        target.namespaceGovernanceFabricPlaneAlignmentMode,
      namespace_governance_fabric_plane_reuse_mode:
        target.namespaceGovernanceFabricPlaneReuseMode,
      namespace_governance_fabric_plane_phase_snapshot_id:
        target.namespaceGovernanceFabricPlanePhaseSnapshotId,
      namespace_governance_fabric_plane_phase_snapshot_summary:
        target.namespaceGovernanceFabricPlanePhaseSnapshotSummary,
      namespace_governance_fabric_plane_phase_snapshot_consumption_mode:
        target.namespaceGovernanceFabricPlanePhaseSnapshotConsumptionMode,
      retrieval_write_digest_alignment:
        target.retrievalWriteDigestAlignment,
      thread_state_candidate:
        target.recordTarget === "thread_state_candidate"
          ? buildPlannedThreadStateCandidatePreview({
              goalText: request.candidate_content,
              sourceTurnId: request.source_turn_id
            })
          : null,
      relationship_key:
        request.kind === "relationship_memory" ? request.relationship_key : null,
      confidence: request.confidence,
      source_turn_id: request.source_turn_id,
      dedupe_key: request.dedupe_key
    };
  });
}

function buildRuntimeMemoryWriteRecordTargets(
  requests: RuntimeMemoryWriteRequest[],
  activeNamespace?: ActiveRuntimeMemoryNamespace | null
) {
  return Array.from(
    new Set(
      requests.map(
        (request) =>
          resolvePlannedMemoryWriteTarget(request, activeNamespace).recordTarget
      )
    )
  );
}

function buildRuntimeMemoryWriteBoundaries(
  requests: RuntimeMemoryWriteRequest[],
  activeNamespace?: ActiveRuntimeMemoryNamespace | null
) {
  return Array.from(
    new Set(
      requests.map(
        (request) =>
          resolvePlannedMemoryWriteTarget(request, activeNamespace).writeBoundary
      )
    )
  );
}

function buildRuntimeFollowUpRequestPreview(
  requests: RuntimeFollowUpRequest[]
) {
  return requests.map((request) => ({
    kind: request.kind,
    trigger_at: request.trigger_at,
    reason: request.reason
  }));
}

function buildFollowUpExecutionResultsPreview(
  results: FollowUpExecutionResult[]
) {
  return results.map((result) => ({
    kind: result.kind,
    status: result.status,
    reason: result.reason,
    trigger_at: result.trigger_at ?? null
  }));
}

function buildFollowUpEnqueuedRecordsPreview(
  records: FollowUpEnqueueRecord[]
) {
  return records.map((record) => ({
    id: record.id,
    kind: record.kind,
    status: record.status,
    trigger_at: record.trigger_at
  }));
}

export function buildRuntimeMemoryWriteRequestMetadata(
  requests: RuntimeMemoryWriteRequest[],
  activeNamespace?: ActiveRuntimeMemoryNamespace | null,
  extraPlannerCandidates?: PlannerCandidatePreview[]
) {
  const preview = buildRuntimeMemoryWriteRequestPreview(
    requests,
    activeNamespace
  );
  const recordTargets = buildRuntimeMemoryWriteRecordTargets(
    requests,
    activeNamespace
  );
  const writeBoundaries = buildRuntimeMemoryWriteBoundaries(
    requests,
    activeNamespace
  );
  const plannerCandidates = buildPlannerCandidatePreviewsFromWriteRequests({
    requests,
    activeNamespace: activeNamespace ?? null
  });
  const mergedPlannerCandidates = plannerCandidates.concat(
    extraPlannerCandidates ?? []
  );
  const plannerSummary = summarizePlannerCandidates(mergedPlannerCandidates);

  return {
    runtime_memory_candidates: {
      count: mergedPlannerCandidates.length,
      preview: mergedPlannerCandidates,
      summary: plannerSummary
    },
    runtime_memory_writes: {
      request_count: requests.length,
      record_targets: recordTargets,
      write_boundaries: writeBoundaries,
      preview
    },
    runtime_memory_candidate_count: mergedPlannerCandidates.length,
    runtime_memory_candidates_preview: mergedPlannerCandidates,
    runtime_memory_candidates_summary: plannerSummary,
    runtime_memory_write_request_count: requests.length,
    runtime_memory_write_record_targets: recordTargets,
    runtime_memory_write_boundaries: writeBoundaries,
    runtime_memory_write_requests_preview: preview
  };
}

export function buildRuntimeFollowUpRequestMetadata(
  requests: RuntimeFollowUpRequest[]
) {
  const preview = buildRuntimeFollowUpRequestPreview(requests);

  return {
    runtime_follow_up: {
      request_count: requests.length,
      preview
    },
    runtime_follow_up_request_count: requests.length,
    runtime_follow_up_requests_preview: preview
  };
}

export function buildRuntimeMemoryWriteOutcomeMetadata(
  outcome: MemoryWriteOutcome,
  existingRuntimeMemoryWrites?: Record<string, unknown> | null
) {
  const writeTypes = Array.from(
    new Set([...outcome.createdTypes, ...outcome.updatedTypes])
  );

  return {
    runtime_memory_writes: {
      ...(existingRuntimeMemoryWrites ?? {}),
      write_count: outcome.createdCount + outcome.updatedCount,
      write_types: writeTypes,
      new_count: outcome.createdCount,
      updated_count: outcome.updatedCount
    },
    memory_write_count: outcome.createdCount + outcome.updatedCount,
    memory_write_types: writeTypes,
    new_memory_count: outcome.createdCount,
    updated_memory_count: outcome.updatedCount
  };
}

export function buildRuntimeFollowUpExecutionMetadata(args: {
  followUpExecutionResults: FollowUpExecutionResult[];
  followUpEnqueueInsertedCount: number;
  followUpEnqueueRecords: FollowUpEnqueueRecord[];
}) {
  const resultsPreview = buildFollowUpExecutionResultsPreview(
    args.followUpExecutionResults
  );
  const enqueuedRecordsPreview = buildFollowUpEnqueuedRecordsPreview(
    args.followUpEnqueueRecords
  );

  return {
    runtime_follow_up_execution: {
      result_count: args.followUpExecutionResults.length,
      results_preview: resultsPreview,
      enqueued_count: args.followUpEnqueueInsertedCount,
      enqueued_records_preview: enqueuedRecordsPreview
    },
    follow_up_execution_result_count: args.followUpExecutionResults.length,
    follow_up_execution_results_preview: resultsPreview,
    follow_up_enqueued_count: args.followUpEnqueueInsertedCount,
    follow_up_enqueued_records_preview: enqueuedRecordsPreview
  };
}

export function buildRuntimeMemoryUsageMetadata(args: {
  updates: RuntimeMemoryUsageUpdate[];
  assistantMetadata?: Record<string, unknown> | null;
}) {
  const relationshipRecallMetadata =
    args.assistantMetadata &&
    typeof args.assistantMetadata === "object" &&
    !Array.isArray(args.assistantMetadata)
      ? getRuntimePreviewMetadataObject(
          getRuntimePreviewMetadataObject(args.assistantMetadata.memory)
            ?.relationship_recall
        )
      : null;

  const usageKinds = Array.from(
    new Set(args.updates.map((update) => update.usage_kind))
  );
  const relationshipUpdates = args.updates.filter(
    (update) => update.usage_kind === "relationship_recall"
  );

  return {
    runtime_memory_usage: {
      update_count: args.updates.length,
      usage_kinds: usageKinds,
      relationship_recall:
        relationshipUpdates.length > 0 || relationshipRecallMetadata
          ? {
              update_count: relationshipUpdates.length,
              memory_ids: relationshipUpdates.map(
                (update) => update.memory_item_id
              ),
              used:
                typeof relationshipRecallMetadata?.used === "boolean"
                  ? relationshipRecallMetadata.used
                  : relationshipUpdates.length > 0,
              direct_naming_question:
                typeof relationshipRecallMetadata?.direct_naming_question ===
                "boolean"
                  ? relationshipRecallMetadata.direct_naming_question
                  : false,
              direct_preferred_name_question:
                typeof relationshipRecallMetadata?.direct_preferred_name_question ===
                "boolean"
                  ? relationshipRecallMetadata.direct_preferred_name_question
                  : false,
              relationship_style_prompt:
                typeof relationshipRecallMetadata?.relationship_style_prompt ===
                "boolean"
                  ? relationshipRecallMetadata.relationship_style_prompt
                  : false,
              same_thread_continuity:
                typeof relationshipRecallMetadata?.same_thread_continuity ===
                "boolean"
                  ? relationshipRecallMetadata.same_thread_continuity
                  : false,
              recalled_keys: Array.isArray(
                relationshipRecallMetadata?.recalled_keys
              )
                ? relationshipRecallMetadata.recalled_keys.filter(
                    (item): item is string =>
                      typeof item === "string" && item.length > 0
                  )
                : []
              ,
              adopted_agent_nickname_target:
                typeof relationshipRecallMetadata?.adopted_agent_nickname_target ===
                "string"
                  ? relationshipRecallMetadata.adopted_agent_nickname_target
                  : null,
              adopted_user_preferred_name_target:
                typeof relationshipRecallMetadata?.adopted_user_preferred_name_target ===
                "string"
                  ? relationshipRecallMetadata.adopted_user_preferred_name_target
                  : null
            }
          : null
    },
    runtime_memory_usage_update_count: args.updates.length,
    runtime_memory_usage_kinds: usageKinds
  };
}
