export type HumanizedArtifactActionValue = "allow" | "defer" | "block" | null;
export type HumanizedDeliveryGateValue = {
  clarifyBeforeAction: boolean;
  reason: string | null;
  conflictHint: string | null;
} | null;

function readHumanizedDeliveryRecord(
  debugMetadata: Record<string, unknown> | undefined
) {
  if (
    !debugMetadata ||
    typeof debugMetadata !== "object" ||
    Array.isArray(debugMetadata)
  ) {
    return null;
  }

  const candidate = debugMetadata.humanized_delivery;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  return candidate as Record<string, unknown>;
}

export function readHumanizedArtifactAction(
  debugMetadata: Record<string, unknown> | undefined,
  key: "artifact_action" | "image_artifact_action" | "audio_artifact_action"
): HumanizedArtifactActionValue {
  const humanizedDelivery = readHumanizedDeliveryRecord(debugMetadata);
  const value = humanizedDelivery?.[key];
  return value === "allow" || value === "defer" || value === "block" ? value : null;
}

export function readHumanizedDeliveryGate(
  debugMetadata: Record<string, unknown> | undefined
): HumanizedDeliveryGateValue {
  const humanizedDelivery = readHumanizedDeliveryRecord(debugMetadata);
  if (!humanizedDelivery) {
    return null;
  }

  const inputConflict = humanizedDelivery.input_conflict === true;
  const conflictHint =
    typeof humanizedDelivery.conflict_hint === "string" &&
    humanizedDelivery.conflict_hint.trim().length > 0
      ? humanizedDelivery.conflict_hint.trim()
      : null;

  if (!inputConflict && !conflictHint) {
    return null;
  }

  return {
    clarifyBeforeAction: inputConflict,
    reason: inputConflict ? "central_input_conflict" : null,
    conflictHint,
  };
}
