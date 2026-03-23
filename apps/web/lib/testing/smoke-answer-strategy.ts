import type {
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt,
  isSmokeRelationshipSupportivePrompt,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-question-prompts";

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
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeBriefSteadyingPrompt,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeShortRelationshipSupportivePrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-follow-up-prompts";

export {
  getSmokeAnswerStrategy,
  getSmokeContinuationReasonCode,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeLightStyleSofteningPrompt,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-strategy";
