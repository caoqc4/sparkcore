import { prepareSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-prep";
import { persistPreparedSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-persistence";
import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { buildSmokePlannerPreviewMetadata } from "@/lib/testing/smoke-planner-preview";

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
  sourceMessageId: string;
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

  const directNamingQuestion = isSmokeDirectNamingQuestion(args.trimmedContent);
  const directPreferredNameQuestion = isSmokeDirectUserPreferredNameQuestion(
    args.trimmedContent
  );
  const recalledKeys = [
    ...(args.analysis.nicknameMemory ? (["agent_nickname"] as const) : []),
    ...(args.analysis.preferredNameMemory
      ? (["user_preferred_name"] as const)
      : []),
    ...(args.analysis.addressStyleMemory
      ? (["user_address_style"] as const)
      : [])
  ];
  const relationshipRecallUsed = recalledKeys.length > 0;
  const relationshipRecallMetadata = relationshipRecallUsed
    ? {
        used: true,
        direct_naming_question: directNamingQuestion,
        direct_preferred_name_question: directPreferredNameQuestion,
        relationship_style_prompt: args.analysis.relationshipStylePrompt,
        same_thread_continuity: args.analysis.sameThreadContinuity,
        recalled_keys: recalledKeys,
        recalled_memory_ids: []
      }
    : null;
  const runtimeMemoryUsageMetadata = relationshipRecallUsed
    ? {
        relationship_recall: {
          update_count: 1,
          memory_ids: [],
          used: true,
          direct_naming_question: directNamingQuestion,
          direct_preferred_name_question: directPreferredNameQuestion,
          relationship_style_prompt: args.analysis.relationshipStylePrompt,
          same_thread_continuity: args.analysis.sameThreadContinuity,
          recalled_keys: recalledKeys
        }
      }
    : null;

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
    sourceMessageId: args.sourceMessageId,
    assistantContent: preparedAssistantTurn.assistantContent,
    trimmedContent: args.trimmedContent,
    relationshipStyleValue: preparedAssistantTurn.effectiveAddressStyleValue,
    replyLanguage: preparedAssistantTurn.replyLanguage,
    replyLanguageSource: preparedAssistantTurn.replyLanguageSource,
    analysis: args.analysis,
    createdTypes: args.createdTypes,
    relationshipRecallMetadata,
    runtimeMemoryUsageMetadata,
    plannerPreviewMetadata: buildSmokePlannerPreviewMetadata({
      trimmedContent: args.trimmedContent,
      sourceMessageId: args.sourceMessageId,
      agentId: args.agentId
    })
  });
}
