import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
import { isTransientSmokeConstraintVisibilityError } from "@/lib/testing/smoke-retry";
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
  plannerPreviewMetadata?: Record<string, unknown> | null;
  relationshipRecallMetadata?: Record<string, unknown> | null;
  runtimeMemoryUsageMetadata?: Record<string, unknown> | null;
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
  let insertedAssistantMessage: { id: string } | null = null;
  let insertedAssistantMessageError: { message: string } | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await insertMessage({
      supabase: args.supabase as SupabaseClient,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      payload: buildSmokeAssistantMessagePayload(args),
      select: "id"
    }).single();

    insertedAssistantMessage = result.data;
    insertedAssistantMessageError = result.error;

    if (!insertedAssistantMessageError || attempt === 3) {
      break;
    }

    if (!isTransientSmokeConstraintVisibilityError(insertedAssistantMessageError)) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  if (insertedAssistantMessageError || !insertedAssistantMessage) {
    throw new Error(
      insertedAssistantMessageError?.message ??
        "Failed to insert the smoke assistant reply."
    );
  }

  return insertedAssistantMessage;
}
