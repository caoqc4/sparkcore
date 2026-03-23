import { persistPreparedSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-persistence";
import { prepareSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-prep";
import type { SmokeAssistantTurnRunInput } from "@/lib/testing/smoke-turn-assistant-run-types";

export async function runSmokeAssistantTurnStep(args: SmokeAssistantTurnRunInput) {
  const {
    assistantContent,
    effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource
  } = prepareSmokeAssistantTurn({
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
    assistantContent,
    relationshipStyleValue: effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource,
    analysis: args.analysis,
    createdTypes: args.createdTypes
  });
}
