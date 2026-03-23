import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";

export function buildRelationshipPlannerMemoryMetadata(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }>
) {
  return {
    source: "runtime_planner",
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
}) {
  return {
    extraction_reason: args.reason,
    source: "runtime_planner",
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
}) {
  return {
    ...(args.existingMetadata ?? {}),
    extraction_reason: args.reason,
    source: "runtime_planner",
    threshold: args.threshold,
    convergence_updated_at: args.convergenceUpdatedAt,
    dedupe_key: args.dedupeKey ?? null,
    write_mode: args.writeMode ?? "upsert"
  };
}
