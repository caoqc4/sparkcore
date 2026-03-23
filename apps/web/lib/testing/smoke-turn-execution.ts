import { applySmokeTurnMemoryUpdates } from "@/lib/testing/smoke-turn-memory-updates";
import {
  insertSmokeUserTurn,
  patchSmokeThreadAfterUserTurn
} from "@/lib/testing/smoke-turn-persistence";
import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";
import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";
import {
  getSmokeRelationshipMemoryValue,
  toSmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-relationship-context";
import {
  analyzeSmokeTurnContext,
  type SmokeMemoryRow,
  type SmokeRuntimeMessage
} from "@/lib/testing/smoke-turn-analysis";
import { buildSmokeAssistantReply } from "@/lib/testing/smoke-assistant-reply";
import { resolveSmokeReplyLanguage } from "@/lib/testing/smoke-reply-analysis";
import type { SmokeTurnContext } from "@/lib/testing/smoke-turn-context";

function buildSmokeRelationshipSeedMetadata(relationKind: string) {
  return buildSmokeSeedMetadata({
    relation_kind: relationKind
  });
}

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
  const smokeExistingMemories = (existingMemories ?? []) as SmokeMemoryRow[];
  const smokeExistingMessages =
    (existingMessages ?? []) as SmokeRuntimeMessage[];
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
  } = analyzeSmokeTurnContext({
    trimmedContent: args.trimmedContent,
    existingMemories: smokeExistingMemories,
    existingMessages: smokeExistingMessages,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });

  const ensuredUserMessage = await insertSmokeUserTurn({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    content: args.trimmedContent
  });

  await patchSmokeThreadAfterUserTurn({
    supabase: admin,
    threadId: thread.id,
    userId: smokeUser.id,
    title: thread.title,
    content: args.trimmedContent
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
  const replyLanguageDecision = resolveSmokeReplyLanguage({
    content: args.trimmedContent,
    recentAssistantReply
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const effectiveAddressStyleValue =
    getSmokeRelationshipMemoryValue(addressStyleMemory);

  const assistantContent = buildSmokeAssistantReply({
    content: args.trimmedContent,
    answerStrategy: answerStrategyRule.answerStrategy,
    modelProfileName: modelProfile.name,
    replyLanguage,
    recentAssistantReply,
    agentName: ensuredAgent.name,
    addressStyleMemory: toSmokeRelationshipRecallMemory(addressStyleMemory),
    nicknameMemory: toSmokeRelationshipRecallMemory(nicknameMemory),
    preferredNameMemory: toSmokeRelationshipRecallMemory(preferredNameMemory),
    recalledMemories
  });
  const insertedAssistantMessage = await insertAnalyzedSmokeAssistantReply({
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
    replyLanguageSource: replyLanguageDecision.source,
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
