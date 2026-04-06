import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion
} from "@/lib/testing/smoke-direct-question-prompts";
import {
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRoleBackgroundQuestion,
  isSmokeRoleBoundaryQuestion,
  isSmokeRoleCapabilityQuestion
} from "@/lib/testing/smoke-open-ended-question-prompts";
import { isSmokeSelfIntroGreetingRequest } from "@/lib/testing/smoke-relationship-prompts";
import type { SmokeAnswerStrategyDecision } from "@/lib/testing/smoke-assistant-builders";
import {
  buildSmokeDirectFactStrategy,
  buildSmokeDirectRelationshipStrategy,
  buildSmokeOpenEndedAdviceStrategy,
  buildSmokeOpenEndedSummaryStrategy,
  buildSmokeRoleBackgroundStrategy,
  buildSmokeRoleBoundaryStrategy,
  buildSmokeRoleCapabilityStrategy,
  buildSmokeRoleSelfIntroStrategy
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

  if (isSmokeSelfIntroGreetingRequest(content)) {
    return buildSmokeRoleSelfIntroStrategy();
  }

  if (isSmokeRoleCapabilityQuestion(content)) {
    return buildSmokeRoleCapabilityStrategy();
  }

  if (isSmokeRoleBackgroundQuestion(content)) {
    return buildSmokeRoleBackgroundStrategy();
  }

  if (isSmokeRoleBoundaryQuestion(content)) {
    return buildSmokeRoleBoundaryStrategy();
  }

  if (isSmokeOpenEndedPlanningHelpQuestion(content)) {
    return buildSmokeOpenEndedAdviceStrategy();
  }

  if (isSmokeOpenEndedSummaryQuestion(content)) {
    return buildSmokeOpenEndedSummaryStrategy();
  }

  return null;
}
