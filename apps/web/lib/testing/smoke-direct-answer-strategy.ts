import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-question-prompts";
import type { SmokeAnswerStrategyDecision } from "@/lib/testing/smoke-answer-strategy-types";
import {
  buildSmokeDirectFactStrategy,
  buildSmokeDirectRelationshipStrategy,
  buildSmokeOpenEndedAdviceStrategy,
  buildSmokeOpenEndedSummaryStrategy
} from "@/lib/testing/smoke-direct-answer-strategy-builders";

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
    return buildSmokeDirectRelationshipStrategy();
  }

  if (directFactQuestion) {
    return buildSmokeDirectFactStrategy();
  }

  if (isSmokeOpenEndedPlanningHelpQuestion(content)) {
    return buildSmokeOpenEndedAdviceStrategy();
  }

  if (isSmokeOpenEndedSummaryQuestion(content)) {
    return buildSmokeOpenEndedSummaryStrategy();
  }

  return null;
}
