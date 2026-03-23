import {
  buildSmokeRoleCorePacket,
  type SmokeAnswerQuestionType,
  type SmokeAnswerStrategy,
  type SmokeAnswerStrategyReasonCode,
  type SmokeApproxContextPressure,
  type SmokeContinuationReasonCode,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";
import { insertSmokeAssistantReply } from "@/lib/testing/smoke-assistant-persistence";
import { detectSmokeReplyLanguage } from "@/lib/testing/smoke-reply-analysis";

export async function insertAnalyzedSmokeAssistantReply({
  supabase,
  threadId,
  workspaceId,
  userId,
  agentId,
  agentName,
  personaSummary,
  styleGuidance,
  modelProfileId,
  modelProfileName,
  model,
  assistantContent,
  relationshipStyleValue,
  replyLanguage,
  replyLanguageSource,
  questionType,
  answerStrategy,
  answerStrategyReasonCode,
  continuationReasonCode,
  recentRawTurnCount,
  approxContextPressure,
  sameThreadContinuationApplicable,
  longChainPressureCandidate,
  sameThreadContinuationPreferred,
  distantMemoryFallbackAllowed,
  recalledMemories,
  usedMemoryTypes,
  hiddenExclusionCount,
  incorrectExclusionCount,
  createdTypes
}: {
  supabase: Parameters<typeof insertSmokeAssistantReply>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  assistantContent: string;
  relationshipStyleValue: string | null;
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
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: Array<"profile" | "preference" | "relationship">;
}) {
  const roleCorePacket = buildSmokeRoleCorePacket({
    agentId,
    agentName,
    personaSummary,
    styleGuidance,
    relationshipStyleValue,
    replyLanguage,
    replyLanguageSource,
    preferSameThreadContinuation: sameThreadContinuationPreferred
  });

  return insertSmokeAssistantReply({
    supabase,
    threadId,
    workspaceId,
    userId,
    agentId,
    agentName,
    roleCorePacket,
    modelProfileId,
    modelProfileName,
    model,
    assistantContent,
    replyLanguage,
    replyLanguageDetected: detectSmokeReplyLanguage(assistantContent),
    replyLanguageSource,
    questionType,
    answerStrategy,
    answerStrategyReasonCode,
    continuationReasonCode,
    recentRawTurnCount,
    approxContextPressure,
    sameThreadContinuationApplicable,
    longChainPressureCandidate,
    sameThreadContinuationPreferred,
    distantMemoryFallbackAllowed,
    recalledMemories,
    usedMemoryTypes,
    hiddenExclusionCount,
    incorrectExclusionCount,
    createdTypes
  });
}
