import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
import { buildSmokeAssistantMessagePayload } from "@/lib/testing/smoke-assistant-message-payload";
import {
  type SmokeApproxContextPressure,
  type SmokeAnswerQuestionType,
  type SmokeAnswerStrategy,
  type SmokeAnswerStrategyReasonCode,
  type SmokeContinuationReasonCode,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource,
  type SmokeRoleCorePacket
} from "@/lib/testing/smoke-assistant-builders";

export async function insertSmokeAssistantReply(args: {
  supabase: SupabaseClient;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  roleCorePacket: SmokeRoleCorePacket;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  assistantContent: string;
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
  recalledMemories: Array<{
    memory_type: string | null;
    content: string;
    confidence: number | null;
  }>;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: string[];
}) {
  const { data: insertedAssistantMessage, error: insertedAssistantMessageError } =
    await insertMessage({
      supabase: args.supabase,
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
