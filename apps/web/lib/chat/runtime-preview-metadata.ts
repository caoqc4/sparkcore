import type {
  RuntimeFollowUpRequest,
  RuntimeMemoryWriteRequest
} from "@/lib/chat/runtime-contract";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
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
  activeNamespace?: ActiveRuntimeMemoryNamespace | null
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

  return {
    runtime_memory_writes: {
      request_count: requests.length,
      record_targets: recordTargets,
      write_boundaries: writeBoundaries,
      preview
    },
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
