import type { SmokeContinuationReasonCode } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeAnswerStrategyDecision } from "@/lib/testing/smoke-assistant-builders";
import { getSmokeContinuationReasonCode } from "@/lib/testing/smoke-continuation-reason";
import { getSmokeDirectOrOpenEndedAnswerStrategy } from "@/lib/testing/smoke-direct-answer-strategy";
export {
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeLightStyleSofteningPrompt,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-prompts";
import { isSmokeRelationshipContinuationEdgePrompt } from "@/lib/testing/smoke-continuation-prompts";
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
}): SmokeAnswerStrategyDecision {
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
      questionType: "fuzzy-follow-up",
      answerStrategy: "same-thread-continuation",
      reasonCode: "same-thread-edge-carryover",
      continuationReasonCode: getSmokeContinuationReasonCode(content)
    };
  }

  if (relationshipStylePrompt) {
    return {
      questionType: "open-ended-summary",
      answerStrategy: "grounded-open-ended-summary",
      reasonCode: "relationship-answer-shape-prompt",
      continuationReasonCode: null
    };
  }

  return {
    questionType: "other",
    answerStrategy: "default-grounded",
    reasonCode: "default-grounded-fallback",
    continuationReasonCode: null
  };
}
