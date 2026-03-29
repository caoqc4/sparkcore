import {
  buildMemoryV2Fields,
  getMemoryStatus,
  inferGenericMemoryStability,
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
  const staticProfile =
    args.target.recordTarget === "static_profile"
      ? buildPlannedStaticProfileRecord({
          workspaceId: args.workspaceId,
          userId: args.userId,
          candidate: args.candidate,
          request: args.matchingRequest,
          sourceTurnId: args.sourceTurnId
        })
      : null;
  const key = staticProfile?.key ?? LEGACY_MEMORY_KEY;
  const value =
    staticProfile?.value !== undefined && staticProfile?.value !== null
      ? String(staticProfile.value)
      : args.candidate.content;
  const sourceRefs =
    staticProfile?.source_refs ??
    (args.sourceTurnId
      ? [{ kind: "message", source_message_id: args.sourceTurnId }]
      : []);

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
      key,
      value,
      scope: args.target.routedScope,
      subjectUserId: args.userId,
      targetAgentId: args.target.routedTargetAgentId,
      targetThreadId: args.target.routedTargetThreadId,
      stability: inferGenericMemoryStability(args.candidate.memory_type),
      status: "active",
      sourceRefs
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
      writePriorityLayer: args.target.writePriorityLayer,
      fallbackWriteBoundary: args.target.fallbackWriteBoundary,
      routedScope: args.target.routedScope,
      routedTargetAgentId: args.target.routedTargetAgentId,
      routedTargetThreadId: args.target.routedTargetThreadId,
      routedProjectId: args.target.routedProjectId,
      routedWorldId: args.target.routedWorldId,
      namespacePrimaryLayer: args.target.namespacePrimaryLayer,
      targetNamespaceId: args.target.targetNamespaceId,
      namespacePolicyBundleId: args.target.namespacePolicyBundleId,
      namespaceGovernanceConvergenceDigestId:
        args.target.namespaceGovernanceConvergenceDigestId,
      namespaceGovernanceConvergenceSummary:
        args.target.namespaceGovernanceConvergenceSummary,
      retrievalWriteDigestAlignment:
        args.target.retrievalWriteDigestAlignment
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
  const staticProfile =
    args.target.recordTarget === "static_profile"
      ? buildPlannedStaticProfileRecord({
          workspaceId: args.workspaceId,
          userId: args.userId,
          candidate: args.candidate,
          request: args.matchingRequest,
          sourceTurnId: args.sourceTurnId
        })
      : null;
  const key = staticProfile?.key ?? LEGACY_MEMORY_KEY;
  const value =
    staticProfile?.value !== undefined && staticProfile?.value !== null
      ? String(staticProfile.value)
      : args.candidate.content;
  const sourceRefs =
    staticProfile?.source_refs ??
    (args.sourceTurnId
      ? [{ kind: "message", source_message_id: args.sourceTurnId }]
      : []);

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
      writePriorityLayer: args.target.writePriorityLayer,
      fallbackWriteBoundary: args.target.fallbackWriteBoundary,
      routedScope: args.target.routedScope,
      routedTargetAgentId: args.target.routedTargetAgentId,
      routedTargetThreadId: args.target.routedTargetThreadId,
      routedProjectId: args.target.routedProjectId,
      routedWorldId: args.target.routedWorldId,
      namespacePrimaryLayer: args.target.namespacePrimaryLayer,
      targetNamespaceId: args.target.targetNamespaceId,
      namespacePolicyBundleId: args.target.namespacePolicyBundleId,
      namespaceGovernanceConvergenceDigestId:
        args.target.namespaceGovernanceConvergenceDigestId,
      namespaceGovernanceConvergenceSummary:
        args.target.namespaceGovernanceConvergenceSummary,
      retrievalWriteDigestAlignment:
        args.target.retrievalWriteDigestAlignment
    }),
    category: args.candidate.memory_type as MemoryType,
    key,
    value,
    scope: args.target.routedScope,
    subject_user_id: args.userId,
    target_agent_id: args.target.routedTargetAgentId,
    target_thread_id: args.target.routedTargetThreadId,
    stability: inferGenericMemoryStability(args.candidate.memory_type),
    status: getMemoryStatus(args.matchingExisting),
    source_refs: sourceRefs as Array<Record<string, string>>
  };
}
