import type {
  AnswerStrategyRelationshipRecallSpec,
  AnswerCompositionTemporalContext,
  AnswerCompositionTemporalHints
} from "@/lib/chat/runtime-composition-contracts";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { SessionContinuitySignal } from "@/lib/chat/session-context";

export function buildTemporalContextPrompt(args: {
  replyLanguage: RuntimeReplyLanguage;
  temporalContext: AnswerCompositionTemporalContext;
  temporalHints: AnswerCompositionTemporalHints;
}) {
  const isZh = args.replyLanguage === "zh-Hans";
  const partOfDayLabel = (() => {
    switch (args.temporalContext.partOfDay) {
      case "morning":
        return isZh ? "早上" : "morning";
      case "noon":
        return isZh ? "中午" : "midday";
      case "afternoon":
        return isZh ? "下午" : "afternoon";
      case "evening":
        return isZh ? "晚上" : "evening";
      default:
        return isZh ? "深夜" : "late night";
    }
  })();

  if (isZh) {
    const sections = [
      `当前本地时间：${args.temporalContext.localDate} ${args.temporalContext.localTime}（${args.temporalContext.timezone}），现在属于${partOfDayLabel}。`,
      "把时段感当作即时语境来用：早上/中午/晚上这些轻招呼要和当前时间一致，不要忽略现在到底是什么时候。"
    ];

    if (args.temporalHints.recentSameSession) {
      sections.push(
        "如果这还是同一段进行中的对话，用户只是轻轻打个招呼，就把它当作续聊里的轻碰一下，不要重开场。"
      );
    }

    return sections.join("\n");
  }

  const sections = [
    `Current local time: ${args.temporalContext.localDate} ${args.temporalContext.localTime} (${args.temporalContext.timezone}), which is ${partOfDayLabel}.`,
    "Use time-of-day as live context: match greetings and tone to whether it is morning, midday, afternoon, evening, or late night right now."
  ];

  if (args.temporalHints.recentSameSession) {
    sections.push(
      "If this is still the same ongoing conversation and the user sends only a light greeting, treat it as a soft touch within the same thread instead of reopening the whole exchange."
    );
  }

  return sections.join("\n");
}

export function buildThreadContinuityPrompt(args: {
  threadContinuity: SessionContinuitySignal;
  replyLanguage: RuntimeReplyLanguage;
  relationshipRecall: AnswerStrategyRelationshipRecallSpec;
  temporalHints: AnswerCompositionTemporalHints;
}) {
  if (!args.threadContinuity.hasPriorAssistantTurn) {
    return "";
  }

  const effectiveLanguage =
    args.replyLanguage !== "unknown"
      ? args.replyLanguage
      : args.threadContinuity.establishedReplyLanguage;
  const isZh = effectiveLanguage === "zh-Hans";
  const relationshipContinuity = Boolean(
    args.relationshipRecall.addressStyleMemory ||
      args.relationshipRecall.nicknameMemory ||
      args.relationshipRecall.preferredNameMemory
  );
  const sections = [
    isZh
      ? "同线程连续性：优先延续这个线程里最近一轮 assistant 已经建立的语言、称呼方式和整体语气，除非用户当前这轮明确要求切换。"
      : "Same-thread continuity: prefer continuing the language, address terms, and overall tone established by the most recent assistant turn in this thread unless the current user message clearly changes it."
  ];

  if (relationshipContinuity) {
    sections.push(
      isZh
        ? "如果这个线程里已经形成了昵称、对用户的称呼或更正式/更轻松的互动方式，让这些关系约定继续自然体现在开场、过渡和收尾里。"
        : "If this thread has already established a nickname, a preferred way to address the user, or a more formal or casual relationship tone, let those choices continue naturally in openings, transitions, and closings."
    );
    sections.push(
      isZh
        ? "即使用户后面只是发很短的跟进、确认或继续提问，也优先延续这个线程已经形成的称呼和关系风格，不要只在第一次命中后就掉回 canonical name 或默认语气。"
        : "Even when later user turns are short follow-ups, confirmations, or brief continuations, keep the established nickname, address terms, and relationship tone instead of dropping back to the canonical name or default style after the first mention."
    );
  }

  if (args.threadContinuity.establishedReplyLanguage !== "unknown") {
    sections.push(
      isZh
        ? `如果用户当前这条消息本身语言不明显，就沿用这个线程里最近一轮 assistant 的语言：${args.threadContinuity.establishedReplyLanguage === "zh-Hans" ? "简体中文" : "英文"}。`
        : `If the current user message is language-ambiguous, fall back to the language used by the most recent assistant turn in this thread: ${args.threadContinuity.establishedReplyLanguage === "zh-Hans" ? "Simplified Chinese" : "English"}.`
    );
  }

  sections.push(
    isZh
      ? "不要让远处历史、全局记忆或 profile 默认值无端打断当前线程已经形成的说话方式。"
      : "Do not let distant history, global memory, or profile defaults unnecessarily reset the speaking style already established in this thread."
  );

  if (args.temporalHints.recentSameSession) {
    sections.push(
      isZh
        ? `时间连续性：这还是同一段进行中的对话，距离上一轮 assistant 大约 ${args.temporalHints.minutesSinceLastAssistant ?? 0} 分钟。不要重新用“早上好/晚上好/很高兴又见到你”这类重启式问候开场。`
        : `Temporal continuity: this is still the same ongoing conversation, about ${args.temporalHints.minutesSinceLastAssistant ?? 0} minutes after the previous assistant turn. Do not reopen with restart-style greetings like "good morning" or "glad to see you again."`
    );
  } else if (args.temporalHints.sameDayContinuation) {
    sections.push(
      isZh
        ? "时间连续性：这仍然是同一天里的延续。除非用户主动寒暄，不要把它写成一次全新的开场。"
        : "Temporal continuity: this is still a same-day continuation. Unless the user clearly opens with a greeting, do not treat it as a brand-new opening."
    );
  }

  if (args.temporalHints.consecutiveUserMessages >= 2) {
    sections.push(
      isZh
        ? `用户刚连续发了 ${args.temporalHints.consecutiveUserMessages} 条消息。把它们视为同一股思路顺着接，不要把最后一条当作全新话题重新起势。`
        : `The user just sent ${args.temporalHints.consecutiveUserMessages} consecutive messages. Treat them as one continuing thought instead of resetting around only the last message.`
    );
  }

  return sections.join("\n");
}
