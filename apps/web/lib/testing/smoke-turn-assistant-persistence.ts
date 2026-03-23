import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";
import type { SmokeCreatedMemoryType } from "@/lib/testing/smoke-assistant-persistence";

export type SmokeAssistantTurnAnalysisSummary = {
  answerStrategyRule: {
    questionType: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["questionType"];
    answerStrategy: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["answerStrategy"];
    reasonCode: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["answerStrategyReasonCode"];
    continuationReasonCode: Parameters<
      typeof insertAnalyzedSmokeAssistantReply
    >[0]["continuationReasonCode"];
  };
  recentRawTurnCount: number;
  approxContextPressure: Parameters<
    typeof insertAnalyzedSmokeAssistantReply
  >[0]["approxContextPressure"];
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  recalledMemories: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["recalledMemories"];
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};

export type SmokePreparedAssistantTurnPersistenceArgs = {
  supabase: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["supabase"];
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
  replyLanguage: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["replyLanguage"];
  replyLanguageSource: Parameters<
    typeof insertAnalyzedSmokeAssistantReply
  >[0]["replyLanguageSource"];
  analysis: SmokeAssistantTurnAnalysisSummary;
  createdTypes: SmokeCreatedMemoryType[];
};

export async function persistPreparedSmokeAssistantTurn(
  args: SmokePreparedAssistantTurnPersistenceArgs
) {
  const { answerStrategyRule } = args.analysis;

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
    questionType: answerStrategyRule.questionType,
    answerStrategy: answerStrategyRule.answerStrategy,
    answerStrategyReasonCode: answerStrategyRule.reasonCode,
    continuationReasonCode: answerStrategyRule.continuationReasonCode,
    recentRawTurnCount: args.analysis.recentRawTurnCount,
    approxContextPressure: args.analysis.approxContextPressure,
    sameThreadContinuationApplicable:
      args.analysis.sameThreadContinuationApplicable,
    longChainPressureCandidate: args.analysis.longChainPressureCandidate,
    sameThreadContinuationPreferred: args.analysis.preferSameThreadContinuation,
    distantMemoryFallbackAllowed: !args.analysis.preferSameThreadContinuation,
    recalledMemories: args.analysis.recalledMemories,
    usedMemoryTypes: args.analysis.usedMemoryTypes,
    hiddenExclusionCount: args.analysis.hiddenExclusionCount,
    incorrectExclusionCount: args.analysis.incorrectExclusionCount,
    createdTypes: args.createdTypes
  });
}
