import { prepareSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-prep";
import { persistPreparedSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-persistence";

export type SmokeTurnAnalysis = ReturnType<
  typeof import("@/lib/testing/smoke-turn-execution-state").prepareSmokeTurnExecutionState
>["analysis"];

export type SmokeAssistantTurnRunInput = {
  supabase: Parameters<typeof persistPreparedSmokeAssistantTurn>[0]["supabase"];
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
  trimmedContent: string;
  analysis: SmokeTurnAnalysis;
  createdTypes: Parameters<typeof persistPreparedSmokeAssistantTurn>[0]["createdTypes"];
};

export async function runSmokeAssistantTurnStep(args: SmokeAssistantTurnRunInput) {
  const preparedAssistantTurn = prepareSmokeAssistantTurn({
    trimmedContent: args.trimmedContent,
    modelProfileName: args.modelProfileName,
    agentName: args.agentName,
    recentAssistantReply: args.analysis.recentAssistantReply,
    addressStyleMemory: args.analysis.addressStyleMemory,
    nicknameMemory: args.analysis.nicknameMemory,
    preferredNameMemory: args.analysis.preferredNameMemory,
    recalledMemories: args.analysis.recalledMemories,
    answerStrategyRule: args.analysis.answerStrategyRule
  });

  return persistPreparedSmokeAssistantTurn({
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
    assistantContent: preparedAssistantTurn.assistantContent,
    relationshipStyleValue: preparedAssistantTurn.effectiveAddressStyleValue,
    replyLanguage: preparedAssistantTurn.replyLanguage,
    replyLanguageSource: preparedAssistantTurn.replyLanguageSource,
    analysis: args.analysis,
    createdTypes: args.createdTypes
  });
}
