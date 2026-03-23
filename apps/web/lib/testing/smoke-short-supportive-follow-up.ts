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
import {
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-soft-follow-up-prompts";
import {
  isSmokeDirectSupportiveFollowUpPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt
} from "@/lib/testing/smoke-supportive-follow-up-literals";

export function isSmokeShortRelationshipSupportivePrompt(content: string) {
  return (
    isSmokeDirectSupportiveFollowUpPrompt(content) ||
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
    isSmokePresenceConfirmingFollowUpPrompt(content)
  );
}
