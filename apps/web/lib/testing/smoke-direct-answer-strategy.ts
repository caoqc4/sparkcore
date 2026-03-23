import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-question-prompts";

type SmokeAnswerStrategyDecision = {
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  reasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
};

export function getSmokeDirectOrOpenEndedAnswerStrategy(
  content: string
): SmokeAnswerStrategyDecision | null {
  const directNamingQuestion = isSmokeDirectNamingQuestion(content);
  const directPreferredNameQuestion =
    isSmokeDirectUserPreferredNameQuestion(content);
  const directFactQuestion =
    isSmokeDirectProfessionQuestion(content) ||
    isSmokeDirectPlanningPreferenceQuestion(content) ||
    isSmokeDirectReplyStyleQuestion(content);

  if (directNamingQuestion || directPreferredNameQuestion) {
    return {
      questionType: "direct-relationship-confirmation",
      answerStrategy: "relationship-recall-first",
      reasonCode: "direct-relationship-question",
      continuationReasonCode: null
    };
  }

  if (directFactQuestion) {
    return {
      questionType: "direct-fact",
      answerStrategy: "structured-recall-first",
      reasonCode: "direct-memory-question",
      continuationReasonCode: null
    };
  }

  if (isSmokeOpenEndedPlanningHelpQuestion(content)) {
    return {
      questionType: "open-ended-advice",
      answerStrategy: "grounded-open-ended-advice",
      reasonCode: "open-ended-advice-prompt",
      continuationReasonCode: null
    };
  }

  if (isSmokeOpenEndedSummaryQuestion(content)) {
    return {
      questionType: "open-ended-summary",
      answerStrategy: "grounded-open-ended-summary",
      reasonCode: "open-ended-summary-prompt",
      continuationReasonCode: null
    };
  }

  return null;
}
