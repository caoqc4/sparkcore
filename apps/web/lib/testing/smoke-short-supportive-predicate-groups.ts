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

export const SMOKE_ANTI_SUPPORTIVE_PREDICATES = [
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
  isSmokeAntiCategorizingFollowUpPrompt
] as const;

export const SMOKE_SOFT_SUPPORTIVE_PREDICATES = [
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokePresenceConfirmingFollowUpPrompt
] as const;

export const SMOKE_DIRECT_SUPPORTIVE_PREDICATES = [
  isSmokeDirectSupportiveFollowUpPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt
] as const;

export function matchesSmokeShortSupportivePredicate(content: string) {
  return (
    SMOKE_DIRECT_SUPPORTIVE_PREDICATES.some((predicate) => predicate(content)) ||
    SMOKE_SOFT_SUPPORTIVE_PREDICATES.some((predicate) => predicate(content)) ||
    SMOKE_ANTI_SUPPORTIVE_PREDICATES.some((predicate) => predicate(content))
  );
}
