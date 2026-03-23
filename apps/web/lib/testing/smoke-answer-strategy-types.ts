import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";

export type SmokeAnswerStrategyDecision = {
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  reasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
};
