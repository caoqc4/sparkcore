import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import { getSmokeContinuationReasonCode } from "@/lib/testing/smoke-continuation-reason";
import { getSmokeDirectOrOpenEndedAnswerStrategy } from "@/lib/testing/smoke-direct-answer-strategy";
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
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-follow-up-prompts";
import {
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-prompts";
export { getSmokeContinuationReasonCode } from "@/lib/testing/smoke-continuation-reason";

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
  const directOrOpenEndedStrategy =
    getSmokeDirectOrOpenEndedAnswerStrategy(content);
  if (directOrOpenEndedStrategy) {
    return directOrOpenEndedStrategy;
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

  return {
    questionType: "other" as SmokeAnswerQuestionType,
    answerStrategy: "default-grounded" as SmokeAnswerStrategy,
    reasonCode: "default-grounded-fallback" as SmokeAnswerStrategyReasonCode,
    continuationReasonCode: null as SmokeContinuationReasonCode | null
  };
}
