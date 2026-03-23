import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeApproxContextPressure,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
  SmokeRoleCorePacket
} from "@/lib/testing/smoke-role-core-packet";

export type SmokeAssistantMetadataRecall = {
  memory_type: string | null;
  content: string;
  confidence: number | null;
};

export type SmokeAssistantMetadataInput = {
  agentId: string;
  agentName: string;
  roleCorePacket: SmokeRoleCorePacket;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageDetected: SmokeReplyLanguage;
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
  recalledMemories: SmokeAssistantMetadataRecall[];
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: string[];
};
