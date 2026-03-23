import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SmokeApproxContextPressure,
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode,
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
  SmokeRoleCorePacket
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeAssistantMetadataRecall } from "@/lib/testing/smoke-assistant-metadata-types";
import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

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

export type SmokeAssistantInsertArgs = {
  supabase: SupabaseClient;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  roleCorePacket: SmokeRoleCorePacket;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageDetected: SmokeReplyLanguage;
  recalledMemories: SmokeAssistantMetadataRecall[];
} & SmokeAssistantPersistenceSharedFields;

export type SmokeAnalyzedAssistantInsertArgs = {
  supabase: SmokeAssistantInsertArgs["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  recalledMemories: SmokeRecallMemory[];
} & SmokeAssistantPersistenceSharedFields;
