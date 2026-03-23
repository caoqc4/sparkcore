import { getAssistantDetectedReplyLanguage } from "@/lib/chat/assistant-message-metadata-read";
import type {
  SmokeApproxContextPressure,
  SmokeReplyLanguage,
  SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";

export type SmokeContinuityReply = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
};

export function detectSmokeExplicitLanguageOverride(
  content: string
): SmokeReplyLanguage {
  const normalized = content.normalize("NFKC").toLowerCase();

  const englishHints = [
    "reply in english",
    "respond in english",
    "answer in english",
    "please use english",
    "请用英文",
    "请用英语",
    "用英文回答",
    "用英语回答"
  ];
  const chineseHints = [
    "reply in chinese",
    "respond in chinese",
    "answer in chinese",
    "continue in chinese",
    "keep replying in chinese",
    "please use chinese",
    "请用中文",
    "用中文回答",
    "请用简体中文",
    "用简体中文回答"
  ];

  if (englishHints.some((hint) => normalized.includes(hint))) {
    return "en";
  }

  if (chineseHints.some((hint) => normalized.includes(hint))) {
    return "zh-Hans";
  }

  return "unknown";
}

export function detectSmokeReplyLanguage(content: string): SmokeReplyLanguage {
  const explicitOverride = detectSmokeExplicitLanguageOverride(content);

  if (explicitOverride !== "unknown") {
    return explicitOverride;
  }

  const hanMatches = content.match(/[\u3400-\u9fff]/g) ?? [];
  const latinMatches = content.match(/[A-Za-z]/g) ?? [];
  const cjkPunctuationMatches = content.match(/[，。！？；：“”‘’（）]/g) ?? [];
  const latinWordMatches = content.match(/\b[A-Za-z]{2,}\b/g) ?? [];

  if (
    hanMatches.length === 0 &&
    latinMatches.length === 0 &&
    cjkPunctuationMatches.length === 0
  ) {
    return "unknown";
  }

  const zhWeight = hanMatches.length + cjkPunctuationMatches.length * 0.5;
  const enWeight =
    latinMatches.length * 0.6 + latinWordMatches.length * 1.4;

  if (hanMatches.length >= 2 && zhWeight >= enWeight * 0.8) {
    return "zh-Hans";
  }

  if (latinWordMatches.length >= 2 && enWeight > zhWeight * 1.15) {
    return "en";
  }

  if (hanMatches.length > latinMatches.length) {
    return "zh-Hans";
  }

  if (latinMatches.length > hanMatches.length) {
    return "en";
  }

  return hanMatches.length > 0 ? "zh-Hans" : "en";
}

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
