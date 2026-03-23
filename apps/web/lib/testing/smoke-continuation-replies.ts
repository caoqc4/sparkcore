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
import { buildSmokeZhBoundaryFollowUpReply } from "@/lib/testing/smoke-zh-boundary-followups";
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

  const boundaryReply = buildSmokeZhBoundaryFollowUpReply({
    content: args.content,
    normalized,
    userName: args.userName
  });
  if (boundaryReply) {
    return boundaryReply;
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
