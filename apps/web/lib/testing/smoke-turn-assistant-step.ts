import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";
import type { SmokeAnalyzedAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence-types";

export async function persistSmokeAssistantTurnStep(
  args: SmokeAnalyzedAssistantInsertArgs
) {
  return insertAnalyzedSmokeAssistantReply({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    agentName: args.agentName,
    personaSummary: args.personaSummary,
    styleGuidance: args.styleGuidance,
    modelProfileId: args.modelProfileId,
    modelProfileName: args.modelProfileName,
    model: args.model,
    assistantContent: args.assistantContent,
    relationshipStyleValue: args.relationshipStyleValue,
    replyLanguage: args.replyLanguage,
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
  });
}
