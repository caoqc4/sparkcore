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
  isSmokeBriefSteadyingPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeLightStyleSofteningPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokeSameSideFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-relationship-detection";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeZhContinuationTail } from "@/lib/testing/smoke-zh-continuation-tail";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeZhDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  const normalized = normalizeSmokePrompt(args.content);
  const styleValue =
    args.addressStyleValue ?? detectSmokeUserAddressStyleCandidate(args.content);

  if (isSmokeOneLineSoftCatchPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，我在，先别一个人扛着。`
      : "我在，先别一个人扛着。";
  }

  if (isSmokeBriefSteadyingPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，先缓一下，我陪着你。`
      : "先缓一下，我陪着你。";
  }

  if (isSmokeGuidedNextStepAfterSteadyingPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，我们先只理眼前这一小步，我陪你慢慢顺。`
      : "我们先只理眼前这一小步，我陪你慢慢顺。";
  }

  if (isSmokeGentleCarryForwardAfterSteadyingPrompt(args.content)) {
    return args.userName
      ? `${args.userName}，先缓一下，我陪你往下顺一点。`
      : "先缓一下，我陪你往下顺一点。";
  }

  if (isSmokeLightSharedPushPrompt(args.content)) {
    if (normalized.includes("陪我把眼前这一下弄过去")) {
      return args.userName
        ? `${args.userName}，好，我先陪你把眼前这一下弄过去。`
        : "好，我先陪你把眼前这一下弄过去。";
    }

    return args.userName
      ? `${args.userName}，好，我们先一起把这一点弄过去。`
      : "好，我们先一起把这一点弄过去。";
  }

  if (isSmokeNonJudgingFollowUpPrompt(args.content)) {
    if (normalized.includes("别数落我")) {
      return args.userName
        ? `${args.userName}，好，我先不数落你，就在这儿陪着你。`
        : "好，我先不数落你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不评判你，就在这儿陪着你。`
      : "好，我先不评判你，就在这儿陪着你。";
  }

  if (isSmokeAntiLecturingFollowUpPrompt(args.content)) {
    if (normalized.includes("别给我上课")) {
      return args.userName
        ? `${args.userName}，好，我先不给你上课，就在这儿陪着你。`
        : "好，我先不给你上课，就在这儿陪着你。";
    }

    if (normalized.includes("别跟我说教")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说教，就在这儿陪着你。`
        : "好，我先不跟你说教，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不教育你，就在这儿陪着你。`
      : "好，我先不教育你，就在这儿陪着你。";
  }

  if (isSmokeAntiCorrectionFollowUpPrompt(args.content)) {
    if (normalized.includes("别老纠正我")) {
      return args.userName
        ? `${args.userName}，好，我先不老纠正你，就在这儿陪着你。`
        : "好，我先不老纠正你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着纠正你，就在这儿陪着你。`
      : "好，我先不急着纠正你，就在这儿陪着你。";
  }

  if (isSmokeAntiConclusionFollowUpPrompt(args.content)) {
    if (normalized.includes("别这么快下结论")) {
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
    if (normalized.includes("别把我想成那样")) {
      return args.userName
        ? `${args.userName}，好，我先不急着把你想成那样，就在这儿陪着你。`
        : "好，我先不急着把你想成那样，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着把你说成那样，就在这儿陪着你。`
      : "好，我先不急着把你说成那样，就在这儿陪着你。";
  }

  if (isSmokeAntiOverreadingFollowUpPrompt(args.content)) {
    if (normalized.includes("别脑补我")) {
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
    if (normalized.includes("别盘问我")) {
      return args.userName
        ? `${args.userName}，好，我先不盘问你，就在这儿陪着你。`
        : "好，我先不盘问你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不问你为什么，就在这儿陪着你。`
      : "好，我先不问你为什么，就在这儿陪着你。";
  }

  if (isSmokeAntiRushingFollowUpPrompt(args.content)) {
    if (normalized.includes("别逼我")) {
      return args.userName
        ? `${args.userName}，好，我先不逼你，就在这儿陪着你。`
        : "好，我先不逼你，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不催你，就在这儿陪着你。`
      : "好，我先不催你，就在这儿陪着你。";
  }

  if (isSmokeAntiSolutioningFollowUpPrompt(args.content)) {
    if (normalized.includes("别上来就帮我解决")) {
      return args.userName
        ? `${args.userName}，好，我先不上来就帮你解决，就在这儿陪着你。`
        : "好，我先不上来就帮你解决，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着帮你解决，就在这儿陪着你。`
      : "好，我先不急着帮你解决，就在这儿陪着你。";
  }

  if (isSmokeAntiComfortingFollowUpPrompt(args.content)) {
    if (normalized.includes("别给我打气")) {
      return args.userName
        ? `${args.userName}，好，我先不给你打气，就在这儿陪着你。`
        : "好，我先不给你打气，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着安慰你，就在这儿陪着你。`
      : "好，我先不急着安慰你，就在这儿陪着你。";
  }

  if (isSmokeAntiAdviceFollowUpPrompt(args.content)) {
    if (normalized.includes("别上来就给我建议")) {
      return args.userName
        ? `${args.userName}，好，我先不上来就给你建议，就在这儿陪着你。`
        : "好，我先不上来就给你建议，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着给你建议，就在这儿陪着你。`
      : "好，我先不急着给你建议，就在这儿陪着你。";
  }

  if (isSmokeAntiMinimizingFollowUpPrompt(args.content)) {
    if (normalized.includes("别跟我说没什么大不了")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说没什么大不了，就在这儿陪着你。`
        : "好，我先不跟你说没什么大不了，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不跟你说这没什么，就在这儿陪着你。`
      : "好，我先不跟你说这没什么，就在这儿陪着你。";
  }

  if (isSmokeAntiNormalizingFollowUpPrompt(args.content)) {
    if (normalized.includes("别跟我说谁都会这样")) {
      return args.userName
        ? `${args.userName}，好，我先不跟你说谁都会这样，就在这儿陪着你。`
        : "好，我先不跟你说谁都会这样，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不跟你说大家都这样，就在这儿陪着你。`
      : "好，我先不跟你说大家都这样，就在这儿陪着你。";
  }

  if (isSmokeAntiComparingFollowUpPrompt(args.content)) {
    if (normalized.includes("别老拿别人跟我比")) {
      return args.userName
        ? `${args.userName}，好，我先不老拿别人跟你比，就在这儿陪着你。`
        : "好，我先不老拿别人跟你比，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不拿别人跟你比，就在这儿陪着你。`
      : "好，我先不拿别人跟你比，就在这儿陪着你。";
  }

  if (isSmokeAntiRedirectionFollowUpPrompt(args.content)) {
    if (normalized.includes("别岔开话题")) {
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
    if (normalized.includes("别跟我讲道理")) {
      return args.userName
        ? `${args.userName}，好，我先站你这边陪着你，不跟你讲道理。`
        : "好，我先站你这边陪着你，不跟你讲道理。";
    }

    return args.userName
      ? `${args.userName}，好，我先站你这边陪着你。`
      : "好，我先站你这边陪着你。";
  }

  return buildSmokeZhContinuationTail({
    content: args.content,
    normalized,
    styleValue,
    userName: args.userName,
    recentAssistantReply: args.recentAssistantReply
  });
}

export function buildSmokeEnDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `Certainly, ${args.userName}. I will continue in a more formal way.`
      : "Certainly. I will continue in a more formal way.";
  }

  if (args.addressStyleValue === "friendly") {
    return args.userName
      ? `Sure, ${args.userName}. Let's keep chatting.`
      : "Sure, let's keep chatting.";
  }

  if (args.addressStyleValue === "casual") {
    return args.userName
      ? isSmokeLightStyleSofteningPrompt(args.content)
        ? `Sure, ${args.userName}. I can keep it lighter while we continue.`
        : `Sure, ${args.userName}. We can keep going.`
      : isSmokeLightStyleSofteningPrompt(args.content)
        ? "Sure, I can keep it lighter while we continue."
        : "Sure, we can keep going.";
  }

  if (args.recentAssistantReply?.replyLanguage === "en") {
    return args.userName
      ? `Sure, ${args.userName}. We can keep going.`
      : "Sure, we can keep going.";
  }

  return "Thanks, I noted that and I am ready to help with the next step.";
}
