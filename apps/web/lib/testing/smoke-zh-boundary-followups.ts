import {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt
} from "@/lib/testing/smoke-answer-strategy";

export function buildSmokeZhBoundaryFollowUpReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  if (isSmokeNonJudgingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别数落我")) {
      return args.userName
        ? `${args.userName}，好，我先不数落你，就在这儿陪着你。`
        : "好，我先不数落你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不评判你，就在这儿陪着你。`
      : "好，我先不评判你，就在这儿陪着你。";
  }

  if (isSmokeAntiLecturingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别给我上课")) {
      return args.userName
        ? `${args.userName}，好，我先不给你上课，就在这儿陪着你。`
        : "好，我先不给你上课，就在这儿陪着你。";
    }

    if (args.normalized.includes("别跟我说教")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说教，就在这儿陪着你。`
        : "好，我先不跟你说教，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不教育你，就在这儿陪着你。`
      : "好，我先不教育你，就在这儿陪着你。";
  }

  if (isSmokeAntiCorrectionFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别老纠正我")) {
      return args.userName
        ? `${args.userName}，好，我先不老纠正你，就在这儿陪着你。`
        : "好，我先不老纠正你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着纠正你，就在这儿陪着你。`
      : "好，我先不急着纠正你，就在这儿陪着你。";
  }

  if (isSmokeAntiConclusionFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别这么快下结论")) {
      return args.userName
        ? `${args.userName}，好，我先不这么快给你下结论，就在这儿陪着你。`
        : "好，我先不这么快给你下结论，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着给你下结论，就在这儿陪着你。`
      : "好，我先不急着给你下结论，就在这儿陪着你。";
  }

  if (isSmokeAntiLabelingFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先不急着给你定性，就在这儿陪着你。`
      : "好，我先不急着给你定性，就在这儿陪着你。";
  }

  if (isSmokeAntiTaggingFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
      : "好，我先不急着给你贴标签，就在这儿陪着你。";
  }

  if (isSmokeAntiMischaracterizationFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别把我想成那样")) {
      return args.userName
        ? `${args.userName}，好，我先不急着把你想成那样，就在这儿陪着你。`
        : "好，我先不急着把你想成那样，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着把你说成那样，就在这儿陪着你。`
      : "好，我先不急着把你说成那样，就在这儿陪着你。";
  }

  if (isSmokeAntiOverreadingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别脑补我")) {
      return args.userName
        ? `${args.userName}，好，我先不急着脑补你，就在这儿陪着你。`
        : "好，我先不急着脑补你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着替你解读，就在这儿陪着你。`
      : "好，我先不急着替你解读，就在这儿陪着你。";
  }

  if (isSmokeAntiAnalysisFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先不急着分析你，就在这儿陪着你。`
      : "好，我先不急着分析你，就在这儿陪着你。";
  }

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

  if (isSmokeAntiDefinitionFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先不替你定义，就在这儿陪着你。`
      : "好，我先不替你定义，就在这儿陪着你。";
  }

  if (isSmokeAntiCategorizingFollowUpPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，好，我先不替你归类，就在这儿陪着你。`
      : "好，我先不替你归类，就在这儿陪着你。";
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
