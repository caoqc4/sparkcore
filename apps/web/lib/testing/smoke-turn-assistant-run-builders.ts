import { prepareSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-prep";
import type { SmokeAssistantTurnRunInput } from "@/lib/testing/smoke-turn-assistant-run-types";

export function buildSmokePreparedAssistantTurn(
  args: SmokeAssistantTurnRunInput
) {
  return prepareSmokeAssistantTurn({
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
}

export function buildSmokePersistedAssistantTurnInput(args: {
  run: SmokeAssistantTurnRunInput;
  preparedAssistantTurn: ReturnType<typeof buildSmokePreparedAssistantTurn>;
}) {
  return {
    supabase: args.run.supabase,
    threadId: args.run.threadId,
    workspaceId: args.run.workspaceId,
    userId: args.run.userId,
    agentId: args.run.agentId,
    agentName: args.run.agentName,
    personaSummary: args.run.personaSummary,
    styleGuidance: args.run.styleGuidance,
    modelProfileId: args.run.modelProfileId,
    modelProfileName: args.run.modelProfileName,
    model: args.run.model,
    assistantContent: args.preparedAssistantTurn.assistantContent,
    relationshipStyleValue: args.preparedAssistantTurn.effectiveAddressStyleValue,
    replyLanguage: args.preparedAssistantTurn.replyLanguage,
    replyLanguageSource: args.preparedAssistantTurn.replyLanguageSource,
    analysis: args.run.analysis,
    createdTypes: args.run.createdTypes
  };
}
