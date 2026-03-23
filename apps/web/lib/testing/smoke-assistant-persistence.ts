import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
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
import { buildSmokeAssistantMessagePayload } from "@/lib/testing/smoke-assistant-message-payload";
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

export async function insertSmokeAssistantReply(args: SmokeAssistantInsertArgs) {
  const { data: insertedAssistantMessage, error: insertedAssistantMessageError } =
    await insertMessage({
      supabase: args.supabase as SupabaseClient,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      payload: buildSmokeAssistantMessagePayload(args),
      select: "id"
    }).single();

  if (insertedAssistantMessageError || !insertedAssistantMessage) {
    throw new Error(
      insertedAssistantMessageError?.message ??
        "Failed to insert the smoke assistant reply."
    );
  }

  return insertedAssistantMessage;
}
