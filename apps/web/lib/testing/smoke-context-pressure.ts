import type { SmokeApproxContextPressure } from "@/lib/testing/smoke-assistant-builders";

export function getSmokeRecentRuntimeMessages(
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }>
) {
  return messages.filter(
    (message) => message.status !== "failed" && message.status !== "pending"
  );
}

export function getSmokeApproxContextPressure(
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }>,
  latestUserMessage: string
): SmokeApproxContextPressure {
  const recentMessages = getSmokeRecentRuntimeMessages(messages);
  const approximateCharacterCount =
    recentMessages.reduce((sum, message) => sum + message.content.trim().length, 0) +
    latestUserMessage.trim().length;
  const recentRawTurnCount = recentMessages.length + 1;

  if (recentRawTurnCount >= 16 || approximateCharacterCount >= 4_200) {
    return "high";
  }

  if (recentRawTurnCount >= 10 || approximateCharacterCount >= 2_600) {
    return "elevated";
  }

  if (recentRawTurnCount >= 6 || approximateCharacterCount >= 1_200) {
    return "medium";
  }

  return "low";
}
