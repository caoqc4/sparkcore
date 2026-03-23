import { applySmokeTurnMemoryUpdates } from "@/lib/testing/smoke-turn-memory-updates";
import { buildSmokeRelationshipSeedMetadata } from "@/lib/testing/smoke-relationship-seed-metadata";
import { persistSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-step";
import { prepareSmokeTurnExecutionState } from "@/lib/testing/smoke-turn-execution-state";
import { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";
import { prepareSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-prep";
import type { SmokeTurnContext } from "@/lib/testing/smoke-turn-context";

export async function executeSmokeTurn(args: {
  context: SmokeTurnContext;
  trimmedContent: string;
}) {
  const {
    admin,
    smokeUser,
    thread,
    agent: ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  } = args.context;
  const { analysis } = prepareSmokeTurnExecutionState({
    trimmedContent: args.trimmedContent,
    existingMemories,
    existingMessages,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });
  const {
    addressStyleMemory,
    answerStrategyRule,
    approxContextPressure,
    hiddenExclusionCount,
    incorrectExclusionCount,
    longChainPressureCandidate,
    nicknameMemory,
    preferredNameMemory,
    preferSameThreadContinuation,
    recentAssistantReply,
    recentRawTurnCount,
    recalledMemories,
    sameThreadContinuationApplicable,
    usedMemoryTypes
  } = analysis;

  const ensuredUserMessage = await persistSmokeUserTurnStep({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    threadTitle: thread.title,
    trimmedContent: args.trimmedContent
  });

  const { createdTypes } = await applySmokeTurnMemoryUpdates({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: ensuredAgent.id,
    sourceMessageId: ensuredUserMessage.id,
    trimmedContent: args.trimmedContent,
    relationshipSeedMetadataBuilder: buildSmokeRelationshipSeedMetadata
  });
  const {
    assistantContent,
    effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource
  } = prepareSmokeAssistantTurn({
    trimmedContent: args.trimmedContent,
    modelProfileName: modelProfile.name,
    agentName: ensuredAgent.name,
    recentAssistantReply,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    recalledMemories,
    answerStrategyRule
  });
  const insertedAssistantMessage = await persistSmokeAssistantTurnStep({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: ensuredAgent.id,
    agentName: ensuredAgent.name,
    personaSummary: ensuredAgent.persona_summary ?? null,
    styleGuidance: ensuredAgent.style_prompt ?? null,
    modelProfileId: modelProfile.id,
    modelProfileName: modelProfile.name,
    model: modelProfile.model,
    assistantContent,
    relationshipStyleValue: effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource,
    questionType: answerStrategyRule.questionType,
    answerStrategy: answerStrategyRule.answerStrategy,
    answerStrategyReasonCode: answerStrategyRule.reasonCode,
    continuationReasonCode: answerStrategyRule.continuationReasonCode,
    recentRawTurnCount,
    approxContextPressure,
    sameThreadContinuationApplicable,
    longChainPressureCandidate,
    sameThreadContinuationPreferred: preferSameThreadContinuation,
    distantMemoryFallbackAllowed: !preferSameThreadContinuation,
    recalledMemories,
    usedMemoryTypes,
    hiddenExclusionCount,
    incorrectExclusionCount,
    createdTypes
  });

  return {
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  };
}
