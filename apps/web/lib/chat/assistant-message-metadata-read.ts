export function getAssistantMetadataObject(
  value: unknown
): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getAssistantMetadataGroup(
  metadata: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown> | null {
  return getAssistantMetadataObject(metadata?.[key]);
}

export function getAssistantDeveloperDiagnosticsMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "developer_diagnostics");
}

export function getAssistantExplanationMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "user_explanation");
}

export function getAssistantLanguageMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "language");
}

export function getAssistantModelProfileMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "model_profile");
}

export function getAssistantMemoryMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "memory");
}

export function getAssistantMemorySemanticSummaryMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const memoryMetadata = getAssistantMemoryMetadata(metadata);
  return getAssistantMetadataGroup(memoryMetadata, "semantic_summary");
}

export function getAssistantMemoryPackMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const memoryMetadata = getAssistantMemoryMetadata(metadata);
  return getAssistantMetadataGroup(memoryMetadata, "pack");
}

export function getAssistantKnowledgeMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "knowledge");
}

export function getAssistantMemoryNamespaceMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "memory_namespace");
}

export function getAssistantThreadCompactionMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "thread_compaction");
}

export function getAssistantAnswerStrategyMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "answer_strategy_details");
}

export function getAssistantSessionMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "session");
}

export function getAssistantThreadStateMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const sessionMetadata = getAssistantSessionMetadata(metadata);
  return getAssistantMetadataGroup(sessionMetadata, "thread_state");
}

export function getAssistantFollowUpMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getAssistantMetadataGroup(metadata, "follow_up");
}

export function getAssistantMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function getAssistantMetadataNumber(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "number" ? value : null;
}

export function getAssistantMetadataBoolean(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "boolean" ? value : null;
}

export function getAssistantMetadataStringArray(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.length > 0
      )
    : [];
}

export function getPreferredAssistantMetadataString(
  preferred: Record<string, unknown> | null | undefined,
  fallback: Record<string, unknown> | null | undefined,
  key: string
) {
  return (
    getAssistantMetadataString(preferred, key) ??
    getAssistantMetadataString(fallback, key)
  );
}

export function getPreferredAssistantMetadataNumber(
  preferred: Record<string, unknown> | null | undefined,
  fallback: Record<string, unknown> | null | undefined,
  key: string
) {
  return (
    getAssistantMetadataNumber(preferred, key) ??
    getAssistantMetadataNumber(fallback, key)
  );
}

export function getPreferredAssistantMetadataBoolean(
  preferred: Record<string, unknown> | null | undefined,
  fallback: Record<string, unknown> | null | undefined,
  key: string
) {
  return (
    getAssistantMetadataBoolean(preferred, key) ??
    getAssistantMetadataBoolean(fallback, key)
  );
}

export function getPreferredAssistantMetadataStringArray(
  preferred: Record<string, unknown> | null | undefined,
  fallback: Record<string, unknown> | null | undefined,
  key: string
) {
  const preferredValue = getAssistantMetadataStringArray(preferred, key);
  return preferredValue.length > 0
    ? preferredValue
    : getAssistantMetadataStringArray(fallback, key);
}

export function getAssistantDetectedReplyLanguage(
  metadata: Record<string, unknown> | null | undefined
) {
  const languageMetadata = getAssistantLanguageMetadata(metadata);
  const diagnosticsMetadata = getAssistantDeveloperDiagnosticsMetadata(metadata);

  return (
    getAssistantMetadataString(languageMetadata, "detected") ??
    getAssistantMetadataString(diagnosticsMetadata, "reply_language_detected") ??
    getAssistantMetadataString(metadata, "reply_language_detected")
  );
}

export function getAssistantUnderlyingModelLabel(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);

  return (
    getPreferredAssistantMetadataString(
      explanationMetadata,
      metadata,
      "underlying_model_label"
    ) ?? getAssistantMetadataString(metadata, "model")
  );
}

export function getAssistantModelProfileName(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const modelProfileMetadata = getAssistantModelProfileMetadata(metadata);

  return (
    getPreferredAssistantMetadataString(
      explanationMetadata,
      metadata,
      "model_profile_name"
    ) ?? getAssistantMetadataString(modelProfileMetadata, "name")
  );
}

export function getAssistantModelProfileTierLabel(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const modelProfileMetadata = getAssistantModelProfileMetadata(metadata);

  return (
    getPreferredAssistantMetadataString(
      explanationMetadata,
      metadata,
      "model_profile_tier_label"
    ) ?? getAssistantMetadataString(modelProfileMetadata, "tier_label")
  );
}

export function getAssistantModelProfileUsageNote(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const modelProfileMetadata = getAssistantModelProfileMetadata(metadata);

  return (
    getPreferredAssistantMetadataString(
      explanationMetadata,
      metadata,
      "model_profile_usage_note"
    ) ?? getAssistantMetadataString(modelProfileMetadata, "usage_note")
  );
}

export function getAssistantMemoryHitCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const memoryMetadata = getAssistantMemoryMetadata(metadata);

  return (
    getPreferredAssistantMetadataNumber(
      explanationMetadata,
      metadata,
      "memory_hit_count"
    ) ??
    getAssistantMetadataNumber(memoryMetadata ?? metadata, "hit_count") ??
    (Array.isArray(metadata?.recalled_memories)
      ? metadata.recalled_memories.length
      : null)
  );
}

export function getAssistantMemoryUsed(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const memoryMetadata = getAssistantMemoryMetadata(metadata);
  const memoryHitCount = getAssistantMemoryHitCount(metadata);

  return (
    getPreferredAssistantMetadataBoolean(
      explanationMetadata,
      metadata,
      "memory_used"
    ) ??
    getAssistantMetadataBoolean(memoryMetadata ?? metadata, "used") ??
    (typeof memoryHitCount === "number" ? memoryHitCount > 0 : null)
  );
}

export function getAssistantMemoryScenarioPackId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "pack_id") ??
    getAssistantMetadataString(metadata, "scenario_memory_pack_id")
  );
}

export function getAssistantMemoryScenarioPackKnowledgePriorityLayer(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return getAssistantMetadataString(packMetadata, "knowledge_priority_layer");
}

export function getAssistantMemoryScenarioPackAssemblyEmphasis(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return getAssistantMetadataString(packMetadata, "assembly_emphasis");
}

export function getAssistantMemoryScenarioPackRouteInfluenceReason(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return getAssistantMetadataString(packMetadata, "route_influence_reason");
}

export function getAssistantMemoryScenarioPackGovernanceRouteBias(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return getAssistantMetadataString(packMetadata, "governance_route_bias");
}

export function getAssistantMemoryScenarioPackStrategyPolicyId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_policy_id") ??
    getAssistantMetadataString(metadata, "scenario_memory_pack_strategy_policy_id")
  );
}

export function getAssistantMemoryScenarioPackOrchestrationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "orchestration_mode") ??
    getAssistantMetadataString(metadata, "scenario_memory_pack_orchestration_mode")
  );
}

export function getAssistantMemoryScenarioPackOrchestrationDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "orchestration_digest_id") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_orchestration_digest_id"
    )
  );
}

export function getAssistantMemoryScenarioPackStrategyRationaleSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_rationale_summary") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_strategy_rationale_summary"
    )
  );
}

export function getAssistantMemoryScenarioPackOrchestrationCoordinationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(
      packMetadata,
      "orchestration_coordination_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_orchestration_coordination_summary"
    )
  );
}

export function getAssistantMemoryScenarioPackStrategyConsistencyMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_consistency_mode") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_strategy_consistency_mode"
    )
  );
}

export function getAssistantMemoryScenarioPackGovernanceConvergenceDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "governance_convergence_digest_id") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_governance_convergence_digest_id"
    )
  );
}

export function getAssistantMemoryScenarioPackStrategyConvergenceSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_convergence_summary") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_strategy_convergence_summary"
    )
  );
}

export function getAssistantMemoryScenarioPackOrchestrationAlignmentMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "orchestration_alignment_mode") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_orchestration_alignment_mode"
    )
  );
}

export function getAssistantMemoryScenarioPackGovernanceUnificationDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "governance_unification_digest_id") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_governance_unification_digest_id"
    )
  );
}

export function getAssistantMemoryScenarioPackStrategyUnificationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_unification_summary") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_strategy_unification_summary"
    )
  );
}

export function getAssistantMemoryScenarioPackOrchestrationUnificationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "orchestration_unification_mode") ??
    getAssistantMetadataString(
      metadata,
      "scenario_memory_pack_orchestration_unification_mode"
    )
  );
}

export function getAssistantMemoryScenarioPackKnowledgeRouteWeight(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataNumber(packMetadata, "knowledge_route_weight") ??
    getAssistantMetadataNumber(
      metadata,
      "scenario_memory_pack_knowledge_route_weight"
    )
  );
}

export function getAssistantMemoryScenarioPackKnowledgeBudgetWeight(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataNumber(packMetadata, "knowledge_budget_weight") ??
    getAssistantMetadataNumber(
      metadata,
      "scenario_memory_pack_knowledge_budget_weight"
    )
  );
}

export function getAssistantMemoryScenarioPackStrategyBundleId(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return (
    getAssistantMetadataString(packMetadata, "strategy_bundle_id") ??
    getAssistantMetadataString(metadata, "scenario_memory_pack_strategy_bundle_id")
  );
}

export function getAssistantMemoryScenarioPackStrategyAssemblyOrder(
  metadata: Record<string, unknown> | null | undefined
) {
  const packMetadata = getAssistantMemoryPackMetadata(metadata);

  return getAssistantMetadataStringArray(
    packMetadata ?? metadata,
    "strategy_assembly_order"
  );
}

export function getAssistantKnowledgeCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataNumber(knowledgeMetadata, "count") ??
    getAssistantMetadataNumber(metadata, "knowledge_count")
  );
}

export function getAssistantKnowledgeScopeLayers(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return getAssistantMetadataStringArray(knowledgeMetadata ?? metadata, "scope_layers");
}

export function getAssistantMemoryNamespacePrimaryLayer(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "primary_layer") ??
    getAssistantMetadataString(metadata, "active_memory_namespace_primary_layer")
  );
}

export function getAssistantMemoryNamespacePolicyBundleId(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "policy_bundle_id") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_policy_bundle_id"
    )
  );
}

export function getAssistantMemoryNamespacePolicyDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "policy_digest_id") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_policy_digest_id"
    )
  );
}

export function getAssistantMemoryNamespaceGovernanceConvergenceDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "governance_convergence_digest_id"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_governance_convergence_digest_id"
    )
  );
}

export function getAssistantMemoryNamespacePolicyCoordinationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "policy_coordination_summary") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_policy_coordination_summary"
    )
  );
}

export function getAssistantMemoryNamespaceGovernanceConsistencyMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "governance_consistency_mode") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_governance_consistency_mode"
    )
  );
}

export function getAssistantMemoryNamespaceRouteGovernanceMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "route_governance_mode") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_route_governance_mode"
    )
  );
}

export function getAssistantMemoryNamespaceRetrievalFallbackMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "retrieval_fallback_mode") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_retrieval_fallback_mode"
    )
  );
}

export function getAssistantMemoryNamespaceWriteEscalationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "write_escalation_mode") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_write_escalation_mode"
    )
  );
}

export function getAssistantMemoryNamespaceGovernanceConvergenceSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "governance_convergence_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_governance_convergence_summary"
    )
  );
}

export function getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "unified_governance_runtime_digest_id"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_unified_governance_runtime_digest_id"
    )
  );
}

export function getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "unified_governance_runtime_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_unified_governance_runtime_summary"
    )
  );
}

export function getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "unified_runtime_alignment_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_unified_runtime_alignment_mode"
    )
  );
}

export function getAssistantMemoryNamespaceUnifiedRuntimeReuseMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(namespaceMetadata, "unified_runtime_reuse_mode") ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_unified_runtime_reuse_mode"
    )
  );
}

export function getAssistantMemoryNamespaceGovernanceConsolidationDigestId(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "governance_consolidation_digest_id"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_governance_consolidation_digest_id"
    )
  );
}

export function getAssistantMemoryNamespaceGovernanceConsolidationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "governance_consolidation_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_governance_consolidation_summary"
    )
  );
}

export function getAssistantMemoryNamespaceRuntimeConsolidationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "runtime_consolidation_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_runtime_consolidation_mode"
    )
  );
}

export function getAssistantMemoryNamespaceRetrievalWriteDigestAlignment(
  metadata: Record<string, unknown> | null | undefined
) {
  const namespaceMetadata = getAssistantMemoryNamespaceMetadata(metadata);

  return (
    getAssistantMetadataString(
      namespaceMetadata,
      "retrieval_write_digest_alignment"
    ) ??
    getAssistantMetadataString(
      metadata,
      "active_memory_namespace_retrieval_write_digest_alignment"
    )
  );
}

export function getAssistantCompactedThreadSummaryText(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "summary_text") ??
    getAssistantMetadataString(metadata, "compacted_thread_summary_text")
  );
}

export function getAssistantThreadRetentionPolicyId(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "retention_policy_id") ??
    getAssistantMetadataString(metadata, "compacted_thread_retention_policy_id")
  );
}

export function getAssistantThreadCrossLayerSurvivalMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "cross_layer_survival_mode") ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_cross_layer_survival_mode"
    )
  );
}

export function getAssistantThreadRetentionDecisionGroup(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "retention_decision_group") ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_retention_decision_group"
    )
  );
}

export function getAssistantThreadSurvivalRationale(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "survival_rationale") ??
    getAssistantMetadataString(metadata, "compacted_thread_survival_rationale")
  );
}

export function getAssistantThreadLifecycleGovernanceDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "lifecycle_governance_digest") ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_governance_digest"
    )
  );
}

export function getAssistantThreadKeepDropGovernanceSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "keep_drop_governance_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_keep_drop_governance_summary"
    )
  );
}

export function getAssistantThreadLifecycleCoordinationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_coordination_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_coordination_summary"
    )
  );
}

export function getAssistantThreadSurvivalConsistencyMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "survival_consistency_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_survival_consistency_mode"
    )
  );
}

export function getAssistantThreadLifecycleConvergenceDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_convergence_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_convergence_digest"
    )
  );
}

export function getAssistantThreadKeepDropConvergenceSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "keep_drop_convergence_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_keep_drop_convergence_summary"
    )
  );
}

export function getAssistantThreadLifecycleAlignmentMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(compactionMetadata, "lifecycle_alignment_mode") ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_alignment_mode"
    )
  );
}

export function getAssistantThreadLifecycleUnificationDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_unification_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_unification_digest"
    )
  );
}

export function getAssistantThreadKeepDropUnificationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "keep_drop_unification_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_keep_drop_unification_summary"
    )
  );
}

export function getAssistantThreadLifecycleUnificationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_unification_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_unification_mode"
    )
  );
}

export function getAssistantThreadLifecycleConsolidationDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_consolidation_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_consolidation_digest"
    )
  );
}

export function getAssistantThreadKeepDropConsolidationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "keep_drop_consolidation_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_keep_drop_consolidation_summary"
    )
  );
}

export function getAssistantThreadLifecycleConsolidationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const compactionMetadata = getAssistantThreadCompactionMetadata(metadata);

  return (
    getAssistantMetadataString(
      compactionMetadata,
      "lifecycle_consolidation_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "compacted_thread_lifecycle_consolidation_mode"
    )
  );
}

export function getAssistantKnowledgeGovernanceCoordinationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_coordination_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_coordination_summary"
    )
  );
}

export function getAssistantKnowledgeBudgetCoordinationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(knowledgeMetadata, "budget_coordination_mode") ??
    getAssistantMetadataString(
      metadata,
      "knowledge_budget_coordination_mode"
    )
  );
}

export function getAssistantKnowledgeSourceGovernanceSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(knowledgeMetadata, "source_governance_summary") ??
    getAssistantMetadataString(
      metadata,
      "knowledge_source_governance_summary"
    )
  );
}

export function getAssistantKnowledgeGovernanceConsistencyMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_consistency_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_consistency_mode"
    )
  );
}

export function getAssistantKnowledgeGovernanceConvergenceDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_convergence_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_convergence_digest"
    )
  );
}

export function getAssistantKnowledgeSourceBudgetAlignmentSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "source_budget_alignment_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_source_budget_alignment_summary"
    )
  );
}

export function getAssistantKnowledgeGovernanceAlignmentMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_alignment_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_alignment_mode"
    )
  );
}

export function getAssistantKnowledgeGovernanceUnificationDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_unification_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_unification_digest"
    )
  );
}

export function getAssistantKnowledgeSourceBudgetUnificationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "source_budget_unification_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_source_budget_unification_summary"
    )
  );
}

export function getAssistantKnowledgeGovernanceUnificationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_unification_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_unification_mode"
    )
  );
}

export function getAssistantKnowledgeGovernanceConsolidationDigest(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_consolidation_digest"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_consolidation_digest"
    )
  );
}

export function getAssistantKnowledgeSourceBudgetConsolidationSummary(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "source_budget_consolidation_summary"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_source_budget_consolidation_summary"
    )
  );
}

export function getAssistantKnowledgeGovernanceConsolidationMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataString(
      knowledgeMetadata,
      "governance_consolidation_mode"
    ) ??
    getAssistantMetadataString(
      metadata,
      "knowledge_governance_consolidation_mode"
    )
  );
}

export function getAssistantMemoryTypesUsed(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const memoryMetadata = getAssistantMemoryMetadata(metadata);
  const preferredTypes = getPreferredAssistantMetadataStringArray(
    explanationMetadata,
    metadata,
    "memory_types_used"
  );

  return preferredTypes.length > 0
    ? preferredTypes
    : getAssistantMetadataStringArray(memoryMetadata ?? metadata, "types_used");
}

export function getAssistantHiddenMemoryExclusionCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const memoryMetadata = getAssistantMemoryMetadata(metadata);

  return (
    getPreferredAssistantMetadataNumber(
      explanationMetadata,
      metadata,
      "hidden_memory_exclusion_count"
    ) ??
    getAssistantMetadataNumber(memoryMetadata ?? metadata, "hidden_exclusion_count") ??
    0
  );
}

export function getAssistantIncorrectMemoryExclusionCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);
  const memoryMetadata = getAssistantMemoryMetadata(metadata);

  return (
    getPreferredAssistantMetadataNumber(
      explanationMetadata,
      metadata,
      "incorrect_memory_exclusion_count"
    ) ??
    getAssistantMetadataNumber(
      memoryMetadata ?? metadata,
      "incorrect_exclusion_count"
    ) ??
    0
  );
}

export function getAssistantMemoryWriteTypes(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);

  return getPreferredAssistantMetadataStringArray(
    explanationMetadata,
    metadata,
    "memory_write_types"
  );
}

export function getAssistantMemoryPrimarySemanticLayer(
  metadata: Record<string, unknown> | null | undefined
) {
  const semanticSummaryMetadata =
    getAssistantMemorySemanticSummaryMetadata(metadata);

  return getAssistantMetadataString(semanticSummaryMetadata, "primary_layer");
}

export function getAssistantMemoryObservedSemanticLayers(
  metadata: Record<string, unknown> | null | undefined
) {
  const semanticSummaryMetadata =
    getAssistantMemorySemanticSummaryMetadata(metadata);

  return getAssistantMetadataStringArray(semanticSummaryMetadata, "observed_layers");
}

export function getAssistantNewMemoryCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);

  return (
    getPreferredAssistantMetadataNumber(
      explanationMetadata,
      metadata,
      "new_memory_count"
    ) ?? 0
  );
}

export function getAssistantUpdatedMemoryCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const explanationMetadata = getAssistantExplanationMetadata(metadata);

  return (
    getPreferredAssistantMetadataNumber(
      explanationMetadata,
      metadata,
      "updated_memory_count"
    ) ?? 0
  );
}

export function getAssistantAnswerStrategySelected(
  metadata: Record<string, unknown> | null | undefined
) {
  const strategyMetadata = getAssistantAnswerStrategyMetadata(metadata);

  return (
    getAssistantMetadataString(strategyMetadata, "selected") ??
    getAssistantMetadataString(metadata, "answer_strategy")
  );
}

export function getAssistantAnswerStrategyReasonCode(
  metadata: Record<string, unknown> | null | undefined
) {
  const strategyMetadata = getAssistantAnswerStrategyMetadata(metadata);

  return (
    getAssistantMetadataString(strategyMetadata, "reason_code") ??
    getAssistantMetadataString(metadata, "answer_strategy_reason_code")
  );
}

export function getAssistantAnswerQuestionType(
  metadata: Record<string, unknown> | null | undefined
) {
  const strategyMetadata = getAssistantAnswerStrategyMetadata(metadata);

  return (
    getAssistantMetadataString(strategyMetadata, "question_type") ??
    getAssistantMetadataString(metadata, "question_type")
  );
}

export function getAssistantSessionContinuationReasonCode(
  metadata: Record<string, unknown> | null | undefined
) {
  const sessionMetadata = getAssistantSessionMetadata(metadata);

  return (
    getAssistantMetadataString(sessionMetadata, "continuation_reason_code") ??
    getAssistantMetadataString(metadata, "continuation_reason_code")
  );
}

export function getAssistantSessionRecentTurnCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const sessionMetadata = getAssistantSessionMetadata(metadata);

  return (
    getAssistantMetadataNumber(sessionMetadata, "recent_turn_count") ??
    getAssistantMetadataNumber(metadata, "recent_raw_turn_count")
  );
}

export function getAssistantSessionContextPressure(
  metadata: Record<string, unknown> | null | undefined
) {
  const sessionMetadata = getAssistantSessionMetadata(metadata);

  const groupedValue = getAssistantMetadataString(sessionMetadata, "context_pressure");
  return groupedValue ?? getAssistantMetadataString(metadata, "approx_context_pressure");
}

export function getAssistantThreadStateLifecycleStatus(
  metadata: Record<string, unknown> | null | undefined
) {
  const threadStateMetadata = getAssistantThreadStateMetadata(metadata);

  return (
    getAssistantMetadataString(threadStateMetadata, "lifecycle_status") ??
    getAssistantMetadataString(metadata, "thread_state_lifecycle_status")
  );
}

export function getAssistantThreadStateFocusMode(
  metadata: Record<string, unknown> | null | undefined
) {
  const threadStateMetadata = getAssistantThreadStateMetadata(metadata);

  return (
    getAssistantMetadataString(threadStateMetadata, "focus_mode") ??
    getAssistantMetadataString(metadata, "thread_state_focus_mode")
  );
}

export function getAssistantThreadStateContinuityStatus(
  metadata: Record<string, unknown> | null | undefined
) {
  const threadStateMetadata = getAssistantThreadStateMetadata(metadata);

  return (
    getAssistantMetadataString(threadStateMetadata, "continuity_status") ??
    getAssistantMetadataString(metadata, "thread_state_continuity_status")
  );
}

export function getAssistantThreadStateCurrentLanguageHint(
  metadata: Record<string, unknown> | null | undefined
) {
  const threadStateMetadata = getAssistantThreadStateMetadata(metadata);

  return (
    getAssistantMetadataString(threadStateMetadata, "current_language_hint") ??
    getAssistantMetadataString(metadata, "thread_state_current_language_hint")
  );
}

export function getAssistantFollowUpRequestCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const followUpMetadata = getAssistantFollowUpMetadata(metadata);

  return (
    getAssistantMetadataNumber(followUpMetadata, "request_count") ??
    getAssistantMetadataNumber(metadata, "follow_up_request_count")
  );
}
