import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
export {
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeLightStyleSofteningPrompt,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-prompts";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-question-prompts";
import {
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
import {
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-prompts";

export function getSmokeContinuationReasonCode(
  content: string
): SmokeContinuationReasonCode | null {
  if (
    isSmokeShortRelationshipSupportivePrompt(content) ||
    isSmokeCompanionStyleExplanationCarryoverPrompt(content) ||
    isSmokeBriefSteadyingPrompt(content) ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeGuidedNextStepAfterSteadyingPrompt(content)
  ) {
    return "brief-supportive-carryover";
  }

  if (isSmokeShortRelationshipSummaryFollowUpPrompt(content)) {
    return "brief-summary-carryover";
  }

  if (isSmokeFuzzyFollowUpQuestion(content)) {
    return "short-fuzzy-follow-up";
  }

  return null;
}

export function getSmokeAnswerStrategy({
  content,
  sameThreadContinuity,
  relationshipStylePrompt,
  relationshipCarryoverAvailable
}: {
  content: string;
  sameThreadContinuity: boolean;
  relationshipStylePrompt: boolean;
  relationshipCarryoverAvailable: boolean;
}) {
  const directNamingQuestion = isSmokeDirectNamingQuestion(content);
  const directPreferredNameQuestion =
    isSmokeDirectUserPreferredNameQuestion(content);
  const directFactQuestion =
    isSmokeDirectProfessionQuestion(content) ||
    isSmokeDirectPlanningPreferenceQuestion(content) ||
    isSmokeDirectReplyStyleQuestion(content);

  if (directNamingQuestion || directPreferredNameQuestion) {
    return {
      questionType: "direct-relationship-confirmation" as SmokeAnswerQuestionType,
      answerStrategy: "relationship-recall-first" as SmokeAnswerStrategy,
      reasonCode: "direct-relationship-question" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (directFactQuestion) {
    return {
      questionType: "direct-fact" as SmokeAnswerQuestionType,
      answerStrategy: "structured-recall-first" as SmokeAnswerStrategy,
      reasonCode: "direct-memory-question" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (
    isSmokeRelationshipContinuationEdgePrompt(content) &&
    (sameThreadContinuity || relationshipCarryoverAvailable)
  ) {
    return {
      questionType: "fuzzy-follow-up" as SmokeAnswerQuestionType,
      answerStrategy: "same-thread-continuation" as SmokeAnswerStrategy,
      reasonCode: "same-thread-edge-carryover" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: getSmokeContinuationReasonCode(content)
    };
  }

  if (relationshipStylePrompt) {
    return {
      questionType: "open-ended-summary" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-summary" as SmokeAnswerStrategy,
      reasonCode: "relationship-answer-shape-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (isSmokeOpenEndedPlanningHelpQuestion(content)) {
    return {
      questionType: "open-ended-advice" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-advice" as SmokeAnswerStrategy,
      reasonCode: "open-ended-advice-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  if (isSmokeOpenEndedSummaryQuestion(content)) {
    return {
      questionType: "open-ended-summary" as SmokeAnswerQuestionType,
      answerStrategy: "grounded-open-ended-summary" as SmokeAnswerStrategy,
      reasonCode: "open-ended-summary-prompt" as SmokeAnswerStrategyReasonCode,
      continuationReasonCode: null as SmokeContinuationReasonCode | null
    };
  }

  return {
    questionType: "other" as SmokeAnswerQuestionType,
    answerStrategy: "default-grounded" as SmokeAnswerStrategy,
    reasonCode: "default-grounded-fallback" as SmokeAnswerStrategyReasonCode,
    continuationReasonCode: null as SmokeContinuationReasonCode | null
  };
}
