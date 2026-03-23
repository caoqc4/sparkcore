import {
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeSameSideFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";

export function buildSmokeZhBoundaryPerspectiveReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  if (isSmokeAntiMinimizingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别跟我说没什么大不了")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说没什么大不了，就在这儿陪着你。`
        : "好，我先不跟你说没什么大不了，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不跟你说这没什么，就在这儿陪着你。`
      : "好，我先不跟你说这没什么，就在这儿陪着你。";
  }

  if (isSmokeAntiNormalizingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别跟我说谁都会这样")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说谁都会这样，就在这儿陪着你。`
        : "好，我先不跟你说谁都会这样，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不跟你说大家都这样，就在这儿陪着你。`
      : "好，我先不跟你说大家都这样，就在这儿陪着你。";
  }

  if (isSmokeAntiComparingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别老拿别人跟我比")) {
      return args.userName
        ? `${args.userName}，好，我先不老拿别人跟你比，就在这儿陪着你。`
        : "好，我先不老拿别人跟你比，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不拿别人跟你比，就在这儿陪着你。`
      : "好，我先不拿别人跟你比，就在这儿陪着你。";
  }

  if (isSmokeCompanionStyleExplanationCarryoverPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先顺着你刚刚那点陪你理一下，不岔开。`
      : "好，我先顺着你刚刚那点陪你理一下，不岔开。";
  }

  if (isSmokeSameSideFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别跟我讲道理")) {
      return args.userName
        ? `${args.userName}，好，我先站你这边陪着你，不跟你讲道理。`
        : "好，我先站你这边陪着你，不跟你讲道理。";
    }

    return args.userName
      ? `${args.userName}，好，我先站你这边陪着你。`
      : "好，我先站你这边陪着你。";
  }

  return null;
}
