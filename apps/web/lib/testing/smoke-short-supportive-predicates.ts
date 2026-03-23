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

export const SMOKE_SHORT_SUPPORTIVE_PREDICATES = [
  isSmokeDirectSupportiveFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokePresenceConfirmingFollowUpPrompt
] as const;
