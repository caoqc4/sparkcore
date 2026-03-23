import { getAssistantDetectedReplyLanguage } from "@/lib/chat/assistant-message-metadata-read";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";
import { detectSmokeExplicitLanguageOverride } from "@/lib/testing/smoke-language-hints";
import { detectSmokeReplyLanguage } from "@/lib/testing/smoke-language-detection";

export type SmokeContinuityReply = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
};

export { detectSmokeExplicitLanguageOverride } from "@/lib/testing/smoke-language-hints";
export { detectSmokeReplyLanguage } from "@/lib/testing/smoke-language-detection";

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

export function resolveSmokeReplyLanguage(args: {
  content: string;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  const latestUserLanguage = detectSmokeReplyLanguage(args.content);

  if (latestUserLanguage !== "unknown") {
    return {
      replyLanguage: latestUserLanguage,
      source: "latest-user-message" as SmokeReplyLanguageSource
    };
  }

  return {
    replyLanguage: args.recentAssistantReply?.replyLanguage ?? "unknown",
    source: args.recentAssistantReply?.replyLanguage
      ? ("thread-continuity-fallback" as SmokeReplyLanguageSource)
      : ("no-latest-user-message" as SmokeReplyLanguageSource)
  };
}
