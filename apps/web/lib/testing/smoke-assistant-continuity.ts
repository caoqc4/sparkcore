import { getAssistantDetectedReplyLanguage } from "@/lib/chat/assistant-message-metadata-read";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import { detectSmokeReplyLanguage } from "@/lib/testing/smoke-language-detection";

export type SmokeContinuityReply = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
};

export function getSmokeRecentAssistantReply(
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }>
): SmokeContinuityReply | null {
  const previousAssistant = [...messages]
    .reverse()
    .find(
      (message) => message.role === "assistant" && message.status === "completed"
    );

  if (!previousAssistant) {
    return null;
  }

  const metadataLanguage = getAssistantDetectedReplyLanguage(
    previousAssistant.metadata
  );
  const replyLanguage =
    metadataLanguage === "zh-Hans" || metadataLanguage === "en"
      ? metadataLanguage
      : detectSmokeReplyLanguage(previousAssistant.content);

  return {
    content: previousAssistant.content,
    replyLanguage
  };
}
