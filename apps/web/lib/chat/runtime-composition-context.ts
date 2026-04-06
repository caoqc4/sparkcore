import type {
  AnswerCompositionTemporalContext,
  AnswerCompositionTemporalHints
} from "@/lib/chat/runtime-composition-contracts";
import type { ReplyLanguageSource, RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { SessionContinuitySignal, RecentRawTurn } from "@/lib/chat/session-context";

function detectExplicitLanguageOverride(content: string): RuntimeReplyLanguage {
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

export function parseIsoMillis(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

export function detectReplyLanguageFromText(content: string): RuntimeReplyLanguage {
  const explicitOverride = detectExplicitLanguageOverride(content);

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
  const enWeight = latinMatches.length * 0.6 + latinWordMatches.length * 1.4;

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

export function isRuntimeReplyLanguage(
  value: unknown
): value is RuntimeReplyLanguage {
  return value === "zh-Hans" || value === "en" || value === "unknown";
}

export function resolveReplyLanguageForTurn(args: {
  latestUserMessage: string | null;
  threadContinuity: SessionContinuitySignal;
}) {
  if (!args.latestUserMessage) {
    return {
      replyLanguage: args.threadContinuity.establishedReplyLanguage,
      source: "no-latest-user-message" as ReplyLanguageSource
    };
  }

  const latestUserLanguage = detectReplyLanguageFromText(args.latestUserMessage);

  if (latestUserLanguage !== "unknown") {
    return {
      replyLanguage: latestUserLanguage,
      source: "latest-user-message" as ReplyLanguageSource
    };
  }

  return {
    replyLanguage: args.threadContinuity.establishedReplyLanguage,
    source: "thread-continuity-fallback" as ReplyLanguageSource
  };
}

export function getImTemporalContinuityHints(
  recentRawTurns: RecentRawTurn[]
): AnswerCompositionTemporalHints {
  if (recentRawTurns.length === 0) {
    return {
      recentSameSession: false,
      sameDayContinuation: false,
      consecutiveUserMessages: 0,
      minutesSinceLastAssistant: null as number | null
    };
  }

  const latestUserTurn = [...recentRawTurns].reverse().find((turn) => turn.role === "user");
  const latestAssistantTurn = [...recentRawTurns]
    .reverse()
    .find((turn) => turn.role === "assistant");

  const latestUserMillis = parseIsoMillis(latestUserTurn?.created_at);
  const latestAssistantMillis = parseIsoMillis(latestAssistantTurn?.created_at);
  const minutesSinceLastAssistant =
    latestUserMillis !== null && latestAssistantMillis !== null
      ? Math.max(0, Math.round((latestUserMillis - latestAssistantMillis) / 60_000))
      : null;
  const sameDayContinuation =
    latestUserTurn !== undefined &&
    latestAssistantTurn !== undefined &&
    latestUserTurn.created_at.slice(0, 10) === latestAssistantTurn.created_at.slice(0, 10);

  let consecutiveUserMessages = 0;
  for (let index = recentRawTurns.length - 1; index >= 0; index -= 1) {
    if (recentRawTurns[index]?.role !== "user") {
      break;
    }
    consecutiveUserMessages += 1;
  }

  return {
    recentSameSession:
      sameDayContinuation &&
      minutesSinceLastAssistant !== null &&
      minutesSinceLastAssistant <= 240,
    sameDayContinuation,
    consecutiveUserMessages,
    minutesSinceLastAssistant
  };
}

export function buildRuntimeTemporalContext(): AnswerCompositionTemporalContext {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || process.env.TZ || "UTC";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const hour = Number(valueByType.get("hour") ?? "0");
  const localDate = `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
  const localTime = `${valueByType.get("hour")}:${valueByType.get("minute")}`;

  let partOfDay: AnswerCompositionTemporalContext["partOfDay"] = "late_night";
  if (hour >= 6 && hour < 11) {
    partOfDay = "morning";
  } else if (hour >= 11 && hour < 14) {
    partOfDay = "noon";
  } else if (hour >= 14 && hour < 18) {
    partOfDay = "afternoon";
  } else if (hour >= 18 && hour < 24) {
    partOfDay = "evening";
  }

  return {
    timezone,
    localDate,
    localTime,
    partOfDay
  };
}
