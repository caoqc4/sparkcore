import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";

export async function persistSmokeAssistantTurnStep(args: {
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
  replyLanguageSource: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["replyLanguageSource"];
  questionType: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["questionType"];
  answerStrategy: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["answerStrategy"];
  answerStrategyReasonCode: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["answerStrategyReasonCode"];
  continuationReasonCode: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["continuationReasonCode"];
  recentRawTurnCount: number;
  approxContextPressure: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["approxContextPressure"];
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  sameThreadContinuationPreferred: boolean;
  distantMemoryFallbackAllowed: boolean;
  recalledMemories: Parameters<typeof insertAnalyzedSmokeAssistantReply>[0]["recalledMemories"];
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: Array<"profile" | "preference" | "relationship">;
}) {
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
