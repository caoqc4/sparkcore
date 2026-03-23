import {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeSameSideFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";

export function buildSmokeZhBoundarySupportReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  if (isSmokeAntiProbingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别盘问我")) {
      return args.userName
        ? `${args.userName}，好，我先不盘问你，就在这儿陪着你。`
        : "好，我先不盘问你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不问你为什么，就在这儿陪着你。`
      : "好，我先不问你为什么，就在这儿陪着你。";
  }

  if (isSmokeAntiRushingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别逼我")) {
      return args.userName
        ? `${args.userName}，好，我先不逼你，就在这儿陪着你。`
        : "好，我先不逼你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不催你，就在这儿陪着你。`
      : "好，我先不催你，就在这儿陪着你。";
  }

  if (isSmokeAntiSolutioningFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别上来就帮我解决")) {
      return args.userName
        ? `${args.userName}，好，我先不上来就帮你解决，就在这儿陪着你。`
        : "好，我先不上来就帮你解决，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着帮你解决，就在这儿陪着你。`
      : "好，我先不急着帮你解决，就在这儿陪着你。";
  }

  if (isSmokeAntiComfortingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别给我打气")) {
      return args.userName
        ? `${args.userName}，好，我先不给你打气，就在这儿陪着你。`
        : "好，我先不给你打气，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着安慰你，就在这儿陪着你。`
      : "好，我先不急着安慰你，就在这儿陪着你。";
  }

  if (isSmokeAntiAdviceFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别上来就给我建议")) {
      return args.userName
        ? `${args.userName}，好，我先不上来就给你建议，就在这儿陪着你。`
        : "好，我先不上来就给你建议，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着给你建议，就在这儿陪着你。`
      : "好，我先不急着给你建议，就在这儿陪着你。";
  }

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

  if (isSmokeAntiRedirectionFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别岔开话题")) {
      return args.userName
        ? `${args.userName}，好，我先不岔开话题，就在这儿陪着你。`
        : "好，我先不岔开话题，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不转移话题，就在这儿陪着你。`
      : "好，我先不转移话题，就在这儿陪着你。";
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
