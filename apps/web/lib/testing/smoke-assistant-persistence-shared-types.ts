import type {
  SmokeApproxContextPressure,
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode,
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeCreatedMemoryType } from "@/lib/testing/smoke-memory-write-types";

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
