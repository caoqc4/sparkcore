import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
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
  isSmokeAntiTaggingFollowUpPrompt
} from "@/lib/testing/smoke-anti-follow-up-prompts";
export {
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
  isSmokeAntiTaggingFollowUpPrompt
};

export function isSmokeShortRelationshipSupportivePrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("鼓励我一句") ||
    normalized.includes("安慰我一句") ||
    normalized.includes("安慰我一下") ||
    normalized.includes("轻轻接我一下") ||
    normalized.includes("接住我一下") ||
    normalized.includes("回我一句就好") ||
    normalized.includes("缓一下，再说") ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeLightSharedPushPrompt(content) ||
    isSmokeNonJudgingFollowUpPrompt(content) ||
    isSmokeAntiLecturingFollowUpPrompt(content) ||
    isSmokeAntiCorrectionFollowUpPrompt(content) ||
    isSmokeAntiConclusionFollowUpPrompt(content) ||
    isSmokeAntiLabelingFollowUpPrompt(content) ||
    isSmokeAntiTaggingFollowUpPrompt(content) ||
    isSmokeAntiMischaracterizationFollowUpPrompt(content) ||
    isSmokeAntiOverreadingFollowUpPrompt(content) ||
    isSmokeAntiAnalysisFollowUpPrompt(content) ||
    isSmokeAntiProbingFollowUpPrompt(content) ||
    isSmokeAntiRushingFollowUpPrompt(content) ||
    isSmokeAntiSolutioningFollowUpPrompt(content) ||
    isSmokeAntiComfortingFollowUpPrompt(content) ||
    isSmokeAntiAdviceFollowUpPrompt(content) ||
    isSmokeAntiMinimizingFollowUpPrompt(content) ||
    isSmokeAntiNormalizingFollowUpPrompt(content) ||
    isSmokeAntiComparingFollowUpPrompt(content) ||
    isSmokeAntiRedirectionFollowUpPrompt(content) ||
    isSmokeAntiDefinitionFollowUpPrompt(content) ||
    isSmokeAntiCategorizingFollowUpPrompt(content) ||
    isSmokeSameSideFollowUpPrompt(content) ||
    isSmokeFriendLikeSoftFollowUpPrompt(content) ||
    isSmokeStayWithMeFollowUpPrompt(content) ||
    isSmokeGentleResumeRhythmPrompt(content) ||
    isSmokePresenceConfirmingFollowUpPrompt(content) ||
    normalized.includes("支持我一下") ||
    normalized.includes("给我一点鼓励") ||
    normalized.includes("give me a little encouragement") ||
    normalized.includes("encourage me a bit") ||
    normalized.includes("comfort me a little")
  );
}

export function isSmokeOneLineSoftCatchPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("回我一句就好");
}

export function isSmokeBriefSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("缓一下") && normalized.includes("再说");
}

export function isSmokeGentleCarryForwardAfterSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("缓一下") &&
    normalized.includes("再陪我往下走一点")
  );
}

export function isSmokeGuidedNextStepAfterSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("陪我理一步");
}

export function isSmokeLightSharedPushPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("一起把这一点弄过去") ||
    normalized.includes("陪我把眼前这一下弄过去")
  );
}

export function isSmokeNonJudgingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别评判我") || normalized.includes("别数落我");
}

export function isSmokeSameSideFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("站我这边") ||
    (normalized.includes("别跟我讲道理") && normalized.includes("站我这边"))
  );
}

export function isSmokeFriendLikeSoftFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("继续陪我说一句");
}

export function isSmokeStayWithMeFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("继续陪着我说就行");
}

export function isSmokeGentleResumeRhythmPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("慢慢继续和我说") ||
    normalized.includes("顺着刚才那样继续说")
  );
}

export function isSmokePresenceConfirmingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("还在这儿陪我") ||
    normalized.includes("先别走开")
  );
}
