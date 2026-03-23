import { insertSmokeAssistantReply } from "@/lib/testing/smoke-assistant-persistence";
import type { SmokeAnalyzedAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence-types";
import { buildSmokeAssistantTurnMetadata } from "@/lib/testing/smoke-turn-assistant-metadata";

function buildSmokeAssistantInsertArgs(
  args: SmokeAnalyzedAssistantInsertArgs
) {
  const { roleCorePacket, replyLanguageDetected } =
    buildSmokeAssistantTurnMetadata({
      agentId: args.agentId,
      agentName: args.agentName,
      personaSummary: args.personaSummary,
      styleGuidance: args.styleGuidance,
      relationshipStyleValue: args.relationshipStyleValue,
      replyLanguage: args.replyLanguage,
      replyLanguageSource: args.replyLanguageSource,
      sameThreadContinuationPreferred: args.sameThreadContinuationPreferred,
      assistantContent: args.assistantContent
    });

  return {
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    agentName: args.agentName,
    roleCorePacket,
    modelProfileId: args.modelProfileId,
    modelProfileName: args.modelProfileName,
    model: args.model,
    assistantContent: args.assistantContent,
    replyLanguage: args.replyLanguage,
    replyLanguageDetected,
    replyLanguageSource: args.replyLanguageSource,
    questionType: args.questionType,
    answerStrategy: args.answerStrategy,
    answerStrategyReasonCode: args.answerStrategyReasonCode,
    continuationReasonCode: args.continuationReasonCode,
    recentRawTurnCount: args.recentRawTurnCount,
    approxContextPressure: args.approxContextPressure,
    sameThreadContinuationApplicable: args.sameThreadContinuationApplicable,
    longChainPressureCandidate: args.longChainPressureCandidate,
    sameThreadContinuationPreferred: args.sameThreadContinuationPreferred,
    distantMemoryFallbackAllowed: args.distantMemoryFallbackAllowed,
    recalledMemories: args.recalledMemories,
    usedMemoryTypes: args.usedMemoryTypes,
    hiddenExclusionCount: args.hiddenExclusionCount,
    incorrectExclusionCount: args.incorrectExclusionCount,
    createdTypes: args.createdTypes
  };
}

export async function insertAnalyzedSmokeAssistantReply({
  ...args
}: SmokeAnalyzedAssistantInsertArgs) {
  return insertSmokeAssistantReply(buildSmokeAssistantInsertArgs(args));
}
