import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { PlannedMemoryRecordTarget } from "@/lib/chat/memory-write-targets";

export function buildRelationshipPlannerMemoryMetadata(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }>,
  namespaceMetadata?: Record<string, unknown>,
  targetMetadata?: {
    writeBoundary?: string | null;
    writePriorityLayer?: string | null;
    fallbackWriteBoundary?: string | null;
    writeEscalationMode?: string | null;
    routedProjectId?: string | null;
    routedWorldId?: string | null;
    namespacePrimaryLayer?: string | null;
    targetNamespaceId?: string | null;
    namespacePolicyBundleId?: string | null;
    namespaceGovernanceConvergenceDigestId?: string | null;
    namespaceGovernanceConvergenceSummary?: string | null;
    namespaceUnifiedGovernanceRuntimeDigestId?: string | null;
    namespaceUnifiedGovernanceRuntimeSummary?: string | null;
    namespaceUnifiedRuntimeAlignmentMode?: string | null;
    namespaceUnifiedRuntimeReuseMode?: string | null;
    retrievalWriteDigestAlignment?: string | null;
  }
): Record<string, unknown> {
  return {
    ...(namespaceMetadata ?? {}),
    source: "runtime_planner",
    record_target: "memory_record",
    semantic_target: "memory_record",
    canonical_memory_type: "relationship",
    write_boundary: targetMetadata?.writeBoundary ?? null,
    write_priority_layer: targetMetadata?.writePriorityLayer ?? null,
    fallback_write_boundary: targetMetadata?.fallbackWriteBoundary ?? null,
    write_escalation_mode: targetMetadata?.writeEscalationMode ?? null,
    routed_scope: "user_agent",
    routed_target_agent_id: request.target_agent_id,
    routed_target_thread_id: request.target_thread_id ?? null,
    routed_project_id: targetMetadata?.routedProjectId ?? null,
    routed_world_id: targetMetadata?.routedWorldId ?? null,
    namespace_primary_layer: targetMetadata?.namespacePrimaryLayer ?? null,
    target_namespace_id: targetMetadata?.targetNamespaceId ?? null,
    namespace_policy_bundle_id:
      targetMetadata?.namespacePolicyBundleId ?? null,
    namespace_governance_convergence_digest_id:
      targetMetadata?.namespaceGovernanceConvergenceDigestId ?? null,
    namespace_governance_convergence_summary:
      targetMetadata?.namespaceGovernanceConvergenceSummary ?? null,
    namespace_unified_governance_runtime_digest_id:
      targetMetadata?.namespaceUnifiedGovernanceRuntimeDigestId ?? null,
    namespace_unified_governance_runtime_summary:
      targetMetadata?.namespaceUnifiedGovernanceRuntimeSummary ?? null,
    namespace_unified_runtime_alignment_mode:
      targetMetadata?.namespaceUnifiedRuntimeAlignmentMode ?? null,
    namespace_unified_runtime_reuse_mode:
      targetMetadata?.namespaceUnifiedRuntimeReuseMode ?? null,
    retrieval_write_digest_alignment:
      targetMetadata?.retrievalWriteDigestAlignment ?? null,
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
  writePriorityLayer?: string | null;
  fallbackWriteBoundary?: string | null;
  writeEscalationMode?: string | null;
  routedScope?: string | null;
  routedTargetAgentId?: string | null;
  routedTargetThreadId?: string | null;
  routedProjectId?: string | null;
  routedWorldId?: string | null;
  namespacePrimaryLayer?: string | null;
  targetNamespaceId?: string | null;
  namespacePolicyBundleId?: string | null;
  namespaceGovernanceConvergenceDigestId?: string | null;
  namespaceGovernanceConvergenceSummary?: string | null;
  namespaceUnifiedGovernanceRuntimeDigestId?: string | null;
  namespaceUnifiedGovernanceRuntimeSummary?: string | null;
  namespaceUnifiedRuntimeAlignmentMode?: string | null;
  namespaceUnifiedRuntimeReuseMode?: string | null;
  retrievalWriteDigestAlignment?: string | null;
}): Record<string, unknown> {
  return {
    ...(args.namespaceMetadata ?? {}),
    extraction_reason: args.reason,
    source: "runtime_planner",
    record_target: args.recordTarget,
    semantic_target: args.recordTarget,
    canonical_memory_type: args.canonicalMemoryType ?? null,
    write_boundary: args.writeBoundary ?? null,
    write_priority_layer: args.writePriorityLayer ?? null,
    fallback_write_boundary: args.fallbackWriteBoundary ?? null,
    write_escalation_mode: args.writeEscalationMode ?? null,
    routed_scope: args.routedScope ?? null,
    routed_target_agent_id: args.routedTargetAgentId ?? null,
    routed_target_thread_id: args.routedTargetThreadId ?? null,
    routed_project_id: args.routedProjectId ?? null,
    routed_world_id: args.routedWorldId ?? null,
    namespace_primary_layer: args.namespacePrimaryLayer ?? null,
    target_namespace_id: args.targetNamespaceId ?? null,
    namespace_policy_bundle_id: args.namespacePolicyBundleId ?? null,
    namespace_governance_convergence_digest_id:
      args.namespaceGovernanceConvergenceDigestId ?? null,
    namespace_governance_convergence_summary:
      args.namespaceGovernanceConvergenceSummary ?? null,
    namespace_unified_governance_runtime_digest_id:
      args.namespaceUnifiedGovernanceRuntimeDigestId ?? null,
    namespace_unified_governance_runtime_summary:
      args.namespaceUnifiedGovernanceRuntimeSummary ?? null,
    namespace_unified_runtime_alignment_mode:
      args.namespaceUnifiedRuntimeAlignmentMode ?? null,
    namespace_unified_runtime_reuse_mode:
      args.namespaceUnifiedRuntimeReuseMode ?? null,
    retrieval_write_digest_alignment:
      args.retrievalWriteDigestAlignment ?? null,
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
  writePriorityLayer?: string | null;
  fallbackWriteBoundary?: string | null;
  writeEscalationMode?: string | null;
  routedScope?: string | null;
  routedTargetAgentId?: string | null;
  routedTargetThreadId?: string | null;
  routedProjectId?: string | null;
  routedWorldId?: string | null;
  namespacePrimaryLayer?: string | null;
  targetNamespaceId?: string | null;
  namespacePolicyBundleId?: string | null;
  namespaceGovernanceConvergenceDigestId?: string | null;
  namespaceGovernanceConvergenceSummary?: string | null;
  namespaceUnifiedGovernanceRuntimeDigestId?: string | null;
  namespaceUnifiedGovernanceRuntimeSummary?: string | null;
  namespaceUnifiedRuntimeAlignmentMode?: string | null;
  namespaceUnifiedRuntimeReuseMode?: string | null;
  retrievalWriteDigestAlignment?: string | null;
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
    write_priority_layer: args.writePriorityLayer ?? null,
    fallback_write_boundary: args.fallbackWriteBoundary ?? null,
    write_escalation_mode: args.writeEscalationMode ?? null,
    routed_scope: args.routedScope ?? null,
    routed_target_agent_id: args.routedTargetAgentId ?? null,
    routed_target_thread_id: args.routedTargetThreadId ?? null,
    routed_project_id: args.routedProjectId ?? null,
    routed_world_id: args.routedWorldId ?? null,
    namespace_primary_layer: args.namespacePrimaryLayer ?? null,
    target_namespace_id: args.targetNamespaceId ?? null,
    namespace_policy_bundle_id: args.namespacePolicyBundleId ?? null,
    namespace_governance_convergence_digest_id:
      args.namespaceGovernanceConvergenceDigestId ?? null,
    namespace_governance_convergence_summary:
      args.namespaceGovernanceConvergenceSummary ?? null,
    namespace_unified_governance_runtime_digest_id:
      args.namespaceUnifiedGovernanceRuntimeDigestId ?? null,
    namespace_unified_governance_runtime_summary:
      args.namespaceUnifiedGovernanceRuntimeSummary ?? null,
    namespace_unified_runtime_alignment_mode:
      args.namespaceUnifiedRuntimeAlignmentMode ?? null,
    namespace_unified_runtime_reuse_mode:
      args.namespaceUnifiedRuntimeReuseMode ?? null,
    retrieval_write_digest_alignment:
      args.retrievalWriteDigestAlignment ?? null,
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
