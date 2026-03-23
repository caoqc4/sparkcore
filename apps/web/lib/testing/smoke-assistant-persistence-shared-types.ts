import type {
  SmokeApproxContextPressure,
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode,
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
} from "@/lib/testing/smoke-assistant-builders";

export type SmokeCreatedMemoryType = "profile" | "preference" | "relationship";

export type SmokeAssistantPersistenceSharedFields = {
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  assistantContent: string;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  answerStrategyReasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
  recentRawTurnCount: number;
  approxContextPressure: SmokeApproxContextPressure;
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  sameThreadContinuationPreferred: boolean;
  distantMemoryFallbackAllowed: boolean;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: SmokeCreatedMemoryType[];
};
