import type {
  RuntimeFollowUpRequest,
  RuntimeMemoryWriteRequest
} from "@/lib/chat/runtime-contract";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";

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
  requests: RuntimeMemoryWriteRequest[]
) {
  return requests.map((request) => {
    const target = resolvePlannedMemoryWriteTarget(request);

    return {
      kind: request.kind,
      memory_type: request.memory_type,
      record_target: target.recordTarget,
      canonical_memory_type: target.canonicalMemoryType,
      relationship_key:
        request.kind === "relationship_memory" ? request.relationship_key : null,
      confidence: request.confidence,
      source_turn_id: request.source_turn_id,
      dedupe_key: request.dedupe_key
    };
  });
}

function buildRuntimeMemoryWriteRecordTargets(
  requests: RuntimeMemoryWriteRequest[]
) {
  return Array.from(
    new Set(
      requests.map(
        (request) => resolvePlannedMemoryWriteTarget(request).recordTarget
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
  requests: RuntimeMemoryWriteRequest[]
) {
  const preview = buildRuntimeMemoryWriteRequestPreview(requests);
  const recordTargets = buildRuntimeMemoryWriteRecordTargets(requests);

  return {
    runtime_memory_writes: {
      request_count: requests.length,
      record_targets: recordTargets,
      preview
    },
    runtime_memory_write_request_count: requests.length,
    runtime_memory_write_record_targets: recordTargets,
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
