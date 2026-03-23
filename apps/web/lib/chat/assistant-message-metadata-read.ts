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

export function getAssistantKnowledgeCount(
  metadata: Record<string, unknown> | null | undefined
) {
  const knowledgeMetadata = getAssistantKnowledgeMetadata(metadata);

  return (
    getAssistantMetadataNumber(knowledgeMetadata, "count") ??
    getAssistantMetadataNumber(metadata, "knowledge_count")
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
