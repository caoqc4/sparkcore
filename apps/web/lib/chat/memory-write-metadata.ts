import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { PlannedMemoryRecordTarget } from "@/lib/chat/memory-write-targets";

export function buildRelationshipPlannerMemoryMetadata(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }>,
  namespaceMetadata?: Record<string, unknown>,
  targetMetadata?: {
    writeBoundary?: string | null;
    namespacePrimaryLayer?: string | null;
    targetNamespaceId?: string | null;
  }
): Record<string, unknown> {
  return {
    ...(namespaceMetadata ?? {}),
    source: "runtime_planner",
    record_target: "memory_record",
    semantic_target: "memory_record",
    canonical_memory_type: "relationship",
    write_boundary: targetMetadata?.writeBoundary ?? null,
    namespace_primary_layer: targetMetadata?.namespacePrimaryLayer ?? null,
    target_namespace_id: targetMetadata?.targetNamespaceId ?? null,
    relation_kind: request.relationship_key,
    dedupe_key: request.dedupe_key ?? null,
    write_mode: request.write_mode ?? "upsert",
    planner_kind: request.kind,
    planner_reason: request.reason
  };
}

export function buildGenericPlannerMemoryInsertMetadata(args: {
  reason: string;
  dedupeKey?: string | null;
  writeMode?: string | null;
  threshold: number;
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType?: string | null;
  namespaceMetadata?: Record<string, unknown>;
  writeBoundary?: string | null;
  namespacePrimaryLayer?: string | null;
  targetNamespaceId?: string | null;
}): Record<string, unknown> {
  return {
    ...(args.namespaceMetadata ?? {}),
    extraction_reason: args.reason,
    source: "runtime_planner",
    record_target: args.recordTarget,
    semantic_target: args.recordTarget,
    canonical_memory_type: args.canonicalMemoryType ?? null,
    write_boundary: args.writeBoundary ?? null,
    namespace_primary_layer: args.namespacePrimaryLayer ?? null,
    target_namespace_id: args.targetNamespaceId ?? null,
    threshold: args.threshold,
    dedupe_key: args.dedupeKey ?? null,
    write_mode: args.writeMode ?? "upsert"
  };
}

export function buildGenericPlannerMemoryUpdateMetadata(args: {
  existingMetadata?: Record<string, unknown> | null;
  reason: string;
  dedupeKey?: string | null;
  writeMode?: string | null;
  threshold: number;
  convergenceUpdatedAt: string;
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType?: string | null;
  namespaceMetadata?: Record<string, unknown>;
  writeBoundary?: string | null;
  namespacePrimaryLayer?: string | null;
  targetNamespaceId?: string | null;
}): Record<string, unknown> {
  return {
    ...(args.existingMetadata ?? {}),
    ...(args.namespaceMetadata ?? {}),
    extraction_reason: args.reason,
    source: "runtime_planner",
    record_target: args.recordTarget,
    semantic_target: args.recordTarget,
    canonical_memory_type: args.canonicalMemoryType ?? null,
    write_boundary: args.writeBoundary ?? null,
    namespace_primary_layer: args.namespacePrimaryLayer ?? null,
    target_namespace_id: args.targetNamespaceId ?? null,
    threshold: args.threshold,
    convergence_updated_at: args.convergenceUpdatedAt,
    dedupe_key: args.dedupeKey ?? null,
    write_mode: args.writeMode ?? "upsert"
  };
}

export function buildSingleSlotMemoryRefreshMetadata(args: {
  existingMetadata?: Record<string, unknown> | null;
  incomingMetadata?: Record<string, unknown> | null;
  normalizedValue: string;
}) {
  return {
    ...(args.existingMetadata ?? {}),
    ...(args.incomingMetadata ?? {}),
    normalization: args.normalizedValue
  };
}

export function buildSingleSlotMemorySupersededMetadata(args: {
  existingMetadata?: Record<string, unknown> | null;
  supersededAt: string;
  sourceMessageId: string;
}) {
  return {
    ...(args.existingMetadata ?? {}),
    superseded_at: args.supersededAt,
    superseded_by_source_message_id: args.sourceMessageId
  };
}

export function buildSingleSlotMemoryInsertMetadata(args: {
  incomingMetadata?: Record<string, unknown> | null;
  normalizedValue: string;
}) {
  return {
    ...(args.incomingMetadata ?? {}),
    normalization: args.normalizedValue
  };
}
