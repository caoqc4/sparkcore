export type SmokeReplyLanguage = "zh-Hans" | "en" | "unknown";
export type SmokeAnswerQuestionType =
  | "direct-fact"
  | "direct-relationship-confirmation"
  | "role-self-introduction"
  | "role-capability"
  | "role-background"
  | "role-boundary"
  | "open-ended-advice"
  | "open-ended-summary"
  | "fuzzy-follow-up"
  | "other";
export type SmokeAnswerStrategy =
  | "structured-recall-first"
  | "relationship-recall-first"
  | "role-presence-first"
  | "grounded-open-ended-advice"
  | "grounded-open-ended-summary"
  | "same-thread-continuation"
  | "default-grounded";
export type SmokeAnswerStrategyReasonCode =
  | "direct-relationship-question"
  | "direct-memory-question"
  | "role-self-intro-prompt"
  | "role-capability-prompt"
  | "role-background-prompt"
  | "role-boundary-prompt"
  | "open-ended-advice-prompt"
  | "open-ended-summary-prompt"
  | "relationship-answer-shape-prompt"
  | "same-thread-edge-carryover"
  | "default-grounded-fallback";
export type SmokeContinuationReasonCode =
  | "short-fuzzy-follow-up"
  | "brief-supportive-carryover"
  | "brief-summary-carryover";
export type SmokeReplyLanguageSource =
  | "latest-user-message"
  | "thread-continuity-fallback"
  | "no-latest-user-message";
export type SmokeApproxContextPressure = "low" | "medium" | "elevated" | "high";
export type SmokeAnswerStrategyDecision = {
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  reasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
};
export type { SmokeRoleCorePacket } from "@/lib/testing/smoke-role-core-packet";
