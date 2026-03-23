import {
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeLightStyleSofteningPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-answer-strategy";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeZhContinuationTail(args: {
  content: string;
  normalized: string;
  styleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  if (isSmokeFriendLikeSoftFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，我继续陪着你说，我们慢慢来。`
      : "我继续陪着你说，我们慢慢来。";
  }

  if (isSmokeStayWithMeFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，我继续陪着你说，就在这儿。`
      : "我继续陪着你说，就在这儿。";
  }

  if (isSmokeGentleResumeRhythmPrompt(args.content)) {
    if (args.normalized.includes("顺着刚才那样继续说")) {
      return args.userName
        ? `${args.userName}，好，我就顺着刚才那样接着说。`
        : "好，我就顺着刚才那样接着说。";
    }

    return args.userName
      ? `${args.userName}，好，我们就慢慢接着说。`
      : "好，我们就慢慢接着说。";
  }

  if (isSmokePresenceConfirmingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("先别走开")) {
      return args.userName
        ? `${args.userName}，好，我先不走开，就在这儿陪着你。`
        : "好，我先不走开，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，我还在这儿陪着你。`
      : "我还在这儿陪着你。";
  }

  if (isSmokeShortRelationshipSummaryFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，我先替你收一句：我们就顺着刚刚那点，慢慢来。`
      : "我先替你收一句：我们就顺着刚刚那点，慢慢来。";
  }

  if (args.styleValue === "formal") {
    return args.userName
      ? `好的，${args.userName}，我会继续用正式一点的方式协助你。`
      : "好的，我会继续用正式一点的方式协助你。";
  }

  if (args.styleValue === "friendly") {
    return args.userName ? `好呀，${args.userName}，我们继续聊。` : "好呀，我们继续聊。";
  }

  if (args.styleValue === "casual") {
    return args.userName
      ? isSmokeLightStyleSofteningPrompt(args.content)
        ? `好呀，${args.userName}，我就轻一点和你说，我们继续。`
        : `好呀，${args.userName}，我们继续。`
      : isSmokeLightStyleSofteningPrompt(args.content)
        ? "好呀，我就轻一点和你说，我们继续。"
        : "好呀，我们继续。";
  }

  if (args.recentAssistantReply?.replyLanguage === "zh-Hans") {
    return args.userName ? `好的，${args.userName}，我们继续。` : "好的，我们继续。";
  }

  return "好的，我已经记下来了，接下来可以继续帮你。";
}
