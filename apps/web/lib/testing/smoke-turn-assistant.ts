import { insertSmokeAssistantReply } from "@/lib/testing/smoke-assistant-persistence";
import type { SmokeAnalyzedAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence-types";
import { buildSmokeAssistantTurnMetadata } from "@/lib/testing/smoke-turn-assistant-metadata";

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
}: SmokeAnalyzedAssistantInsertArgs) {
  const { roleCorePacket, replyLanguageDetected } =
    buildSmokeAssistantTurnMetadata({
      agentId,
      agentName,
      personaSummary,
      styleGuidance,
      relationshipStyleValue,
      replyLanguage,
      replyLanguageSource,
      sameThreadContinuationPreferred,
      assistantContent
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
    replyLanguageDetected,
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
