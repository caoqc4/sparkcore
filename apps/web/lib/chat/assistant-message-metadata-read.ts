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
