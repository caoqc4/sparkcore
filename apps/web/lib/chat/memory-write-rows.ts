import {
  buildMemoryV2Fields,
  getMemoryStatus,
  inferLegacyMemoryStability,
  LEGACY_MEMORY_KEY
} from "@/lib/chat/memory-v2";
import type {
  MemoryCandidate,
  MemoryType,
  MemoryUpsertRow,
  StoredMemory
} from "@/lib/chat/memory-shared";
import {
  buildGenericPlannerMemoryInsertMetadata,
  buildGenericPlannerMemoryUpdateMetadata
} from "@/lib/chat/memory-write-metadata";
import { buildPlannedStaticProfileRecord } from "@/lib/chat/memory-write-record-candidates";
import type { RuntimeGenericMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { PlannedGenericMemoryWriteTarget as GenericWriteTarget } from "@/lib/chat/memory-write-targets";

export function buildPlannedGenericMemoryInsertRow(args: {
  workspaceId: string;
  userId: string;
  agentId: string | null;
  candidate: MemoryCandidate & { normalized_content?: string };
  matchingRequest?: RuntimeGenericMemoryWriteRequest;
  sourceTurnId?: string;
  threshold: number;
  target: GenericWriteTarget;
  namespaceMetadata?: Record<string, unknown>;
}): Record<string, unknown> {
  const staticProfile = buildPlannedStaticProfileRecord({
    workspaceId: args.workspaceId,
    userId: args.userId,
    candidate: args.candidate,
    request: args.matchingRequest,
    sourceTurnId: args.sourceTurnId
  });

  return {
    workspace_id: args.workspaceId,
    user_id: args.userId,
    agent_id: args.agentId,
    source_message_id: args.sourceTurnId,
    memory_type: args.candidate.memory_type,
    content: args.candidate.content,
    confidence: Number(args.candidate.confidence.toFixed(2)),
    importance: 0.5,
    ...buildMemoryV2Fields({
      category: args.candidate.memory_type,
      key: staticProfile.key ?? LEGACY_MEMORY_KEY,
      value: String(staticProfile.value),
      scope: args.target.legacyScope,
      subjectUserId: args.userId,
      stability: inferLegacyMemoryStability(args.candidate.memory_type),
      status: "active",
      sourceRefs: staticProfile.source_refs
    }),
    metadata: buildGenericPlannerMemoryInsertMetadata({
      reason: args.candidate.reason,
      dedupeKey: args.matchingRequest?.dedupe_key ?? null,
      writeMode: args.matchingRequest?.write_mode ?? "upsert",
      threshold: args.threshold,
      recordTarget: args.target.recordTarget,
      canonicalMemoryType: args.target.canonicalMemoryType,
      namespaceMetadata: args.namespaceMetadata,
      writeBoundary: args.target.writeBoundary,
      namespacePrimaryLayer: args.target.namespacePrimaryLayer,
      targetNamespaceId: args.target.targetNamespaceId
    })
  };
}

export function buildPlannedGenericMemoryUpdateRow(args: {
  workspaceId: string;
  candidate: MemoryCandidate & { normalized_content?: string };
  matchingExisting: StoredMemory;
  matchingRequest?: RuntimeGenericMemoryWriteRequest;
  sourceTurnId?: string;
  userId: string;
  threshold: number;
  target: GenericWriteTarget;
  convergenceUpdatedAt: string;
  namespaceMetadata?: Record<string, unknown>;
}): MemoryUpsertRow {
  const staticProfile = buildPlannedStaticProfileRecord({
    workspaceId: args.workspaceId,
    userId: args.userId,
    candidate: args.candidate,
    request: args.matchingRequest,
    sourceTurnId: args.sourceTurnId
  });

  return {
    id: args.matchingExisting.id,
    memory_type: args.candidate.memory_type as MemoryType,
    content: args.candidate.content,
    confidence: Number(args.candidate.confidence.toFixed(2)),
    metadata: buildGenericPlannerMemoryUpdateMetadata({
      existingMetadata: args.matchingExisting.metadata ?? {},
      reason: args.candidate.reason,
      dedupeKey: args.matchingRequest?.dedupe_key ?? null,
      writeMode: args.matchingRequest?.write_mode ?? "upsert",
      threshold: args.threshold,
      convergenceUpdatedAt: args.convergenceUpdatedAt,
      recordTarget: args.target.recordTarget,
      canonicalMemoryType: args.target.canonicalMemoryType,
      namespaceMetadata: args.namespaceMetadata,
      writeBoundary: args.target.writeBoundary,
      namespacePrimaryLayer: args.target.namespacePrimaryLayer,
      targetNamespaceId: args.target.targetNamespaceId
    }),
    category: args.candidate.memory_type as MemoryType,
    key: staticProfile.key ?? LEGACY_MEMORY_KEY,
    value: String(staticProfile.value),
    scope: args.target.legacyScope,
    subject_user_id: args.userId,
    target_agent_id: null,
    target_thread_id: null,
    stability: inferLegacyMemoryStability(args.candidate.memory_type),
    status: getMemoryStatus(args.matchingExisting),
    source_refs: staticProfile.source_refs as Array<Record<string, string>>
  };
}
