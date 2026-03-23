export function getModelProfileTierLabel(
  metadata: Record<string, unknown> | null | undefined
) {
  return typeof metadata?.tier_label === "string" ? metadata.tier_label : null;
}

export function getModelProfileUsageNote(
  metadata: Record<string, unknown> | null | undefined
) {
  return typeof metadata?.usage_note === "string" ? metadata.usage_note : null;
}

export function getUnderlyingModelLabel(
  metadata: Record<string, unknown> | null | undefined
) {
  return typeof metadata?.underlying_model === "string" &&
    metadata.underlying_model.trim().length > 0
    ? metadata.underlying_model
    : null;
}
