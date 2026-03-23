export type SmokeReplyLanguage = "zh-Hans" | "en" | "unknown";
export type SmokeAnswerQuestionType =
  | "direct-fact"
  | "direct-relationship-confirmation"
  | "open-ended-advice"
  | "open-ended-summary"
  | "fuzzy-follow-up"
  | "other";
export type SmokeAnswerStrategy =
  | "structured-recall-first"
  | "relationship-recall-first"
  | "grounded-open-ended-advice"
  | "grounded-open-ended-summary"
  | "same-thread-continuation"
  | "default-grounded";
export type SmokeAnswerStrategyReasonCode =
  | "direct-relationship-question"
  | "direct-memory-question"
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
export type { SmokeRoleCorePacket } from "@/lib/testing/smoke-role-core-packet";
export { buildSmokeRoleCorePacket } from "@/lib/testing/smoke-role-core-packet";
export { buildSmokeAssistantMetadata } from "@/lib/testing/smoke-assistant-metadata";
