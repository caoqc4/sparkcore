import type {
  SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";
import {
  detectSmokeReplyLanguage
} from "@/lib/testing/smoke-language-detection";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-assistant-continuity";

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
