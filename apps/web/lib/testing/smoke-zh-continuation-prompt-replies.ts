import {
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";

export function buildSmokeZhContinuationPromptReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
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

  return null;
}
