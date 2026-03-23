import type { SmokeAnswerStrategyDecision } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeDirectRelationshipStrategy(): SmokeAnswerStrategyDecision {
  return {
    questionType: "direct-relationship-confirmation",
    answerStrategy: "relationship-recall-first",
    reasonCode: "direct-relationship-question",
    continuationReasonCode: null
  };
}

export function buildSmokeDirectFactStrategy(): SmokeAnswerStrategyDecision {
  return {
    questionType: "direct-fact",
    answerStrategy: "structured-recall-first",
    reasonCode: "direct-memory-question",
    continuationReasonCode: null
  };
}

export function buildSmokeOpenEndedAdviceStrategy(): SmokeAnswerStrategyDecision {
  return {
    questionType: "open-ended-advice",
    answerStrategy: "grounded-open-ended-advice",
    reasonCode: "open-ended-advice-prompt",
    continuationReasonCode: null
  };
}

export function buildSmokeOpenEndedSummaryStrategy(): SmokeAnswerStrategyDecision {
  return {
    questionType: "open-ended-summary",
    answerStrategy: "grounded-open-ended-summary",
    reasonCode: "open-ended-summary-prompt",
    continuationReasonCode: null
  };
}
