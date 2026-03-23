import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode,
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-reply-language";

export type SmokeAssistantTurnStrategyRule = {
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  reasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
};

export type SmokeAssistantTurnPrepInput = {
  trimmedContent: string;
  modelProfileName: string;
  agentName: string;
  recentAssistantReply: SmokeContinuityReply | null;
  addressStyleMemory: unknown;
  nicknameMemory: unknown;
  preferredNameMemory: unknown;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  answerStrategyRule: SmokeAssistantTurnStrategyRule;
};

export type SmokePreparedAssistantTurn = {
  assistantContent: string;
  effectiveAddressStyleValue: string | null;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
};

export type SmokeAssistantTurnMetadataInput = {
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  sameThreadContinuationPreferred: boolean;
  assistantContent: string;
};
