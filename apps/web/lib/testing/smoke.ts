import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { loadThreadMessages } from "@/lib/chat/message-read";
import { loadRecentOwnedMemories } from "@/lib/chat/memory-item-read";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-seed-persistence";
import {
  ensureSmokeModelProfiles,
  ensureSmokeUser,
  getSmokeAdminClient,
  resetSmokeWorkspaceState,
  seedSmokeAgents,
  type SmokeConfig,
  type SmokeUser
} from "@/lib/testing/smoke-runtime-state";
import { loadSmokeTurnContext } from "@/lib/testing/smoke-turn-context";
import { resetSmokeState } from "@/lib/testing/smoke-reset";
import { applySmokeTurnMemoryUpdates } from "@/lib/testing/smoke-turn-memory-updates";
import {
  insertSmokeUserTurn,
  patchSmokeThreadAfterUserTurn
} from "@/lib/testing/smoke-turn-persistence";
import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";
import {
  type SmokeAnswerQuestionType,
  type SmokeAnswerStrategy,
  type SmokeAnswerStrategyReasonCode,
  type SmokeApproxContextPressure,
  type SmokeContinuationReasonCode,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipSupportivePrompt,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";
import {
  getSmokeRelationshipMemoryValue
} from "@/lib/testing/smoke-relationship-context";
import { toSmokeRelationshipRecallMemory } from "@/lib/testing/smoke-relationship-context";
import {
  analyzeSmokeTurnContext,
  type SmokeContinuityReply
} from "@/lib/testing/smoke-turn-analysis";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke-config";
import { buildSmokeDirectOrGroundedReply } from "@/lib/testing/smoke-direct-replies";
import { createSmokeLoginResponse } from "@/lib/testing/smoke-login";
import {
  buildSmokeDefaultContinuationReply,
  buildSmokeRelationshipClosingReply,
  buildSmokeRelationshipExplanatoryReply,
  buildSmokeRelationshipSupportiveReply
} from "@/lib/testing/smoke-relationship-replies";
import { createSmokeThread } from "@/lib/testing/smoke-threads";
import {
  resolveSmokeReplyLanguage
} from "@/lib/testing/smoke-reply-analysis";

const SMOKE_MODEL_PROFILES = getSmokeModelProfiles();

export { getSmokeConfig, isAuthorizedSmokeRequest };

type SmokeThread = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  agent_id: string | null;
  title: string;
};

function buildSmokeRelationshipSeedMetadata(relationKind: string) {
  return buildSmokeSeedMetadata({
    relation_kind: relationKind
  });
}

export { resetSmokeState };

export { createSmokeThread };

function buildSmokeAssistantReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
  recentAssistantReply,
  recalledMemories,
  agentName,
  addressStyleMemory,
  nicknameMemory,
  preferredNameMemory
}: {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  modelProfileName: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  nicknameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  preferredNameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
}) {
  const directOrGroundedReply = buildSmokeDirectOrGroundedReply({
    content,
    answerStrategy,
    modelProfileName,
    replyLanguage,
    recalledMemories,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (directOrGroundedReply) {
    return directOrGroundedReply;
  }

  if (isSmokeRelationshipExplanatoryPrompt(content)) {
    return buildSmokeRelationshipExplanatoryReply({
      content,
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      selfName: nicknameMemory?.content ?? agentName,
      userName: preferredNameMemory?.content ?? null
    });
  }

  if (isSmokeRelationshipSupportivePrompt(content)) {
    return buildSmokeRelationshipSupportiveReply({
      content,
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      selfName: nicknameMemory?.content ?? agentName,
      userName: preferredNameMemory?.content ?? null
    });
  }

  if (isSmokeRelationshipClosingPrompt(content)) {
    return buildSmokeRelationshipClosingReply({
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      userName: preferredNameMemory?.content ?? null
    });
  }

  return buildSmokeDefaultContinuationReply({
    content,
    replyLanguage,
    addressStyleValue: addressStyleMemory?.content ?? null,
    userName: preferredNameMemory?.content ?? null,
    recentAssistantReply
  });
}

export async function createSmokeTurn({
  threadId,
  content
}: {
  threadId: string;
  content: string;
}) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Smoke turn content is required.");
  }

  const {
    admin,
    smokeUser,
    thread,
    agent: ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  } = await loadSmokeTurnContext({
    threadId
  });

  const smokeExistingMemories = (existingMemories ?? []) as Array<{
    id: string;
    memory_type: "profile" | "preference" | null;
    content: string;
    confidence: number;
    category: string | null;
    key: string | null;
    value: string | null;
    scope: string | null;
    status: string | null;
    target_agent_id: string | null;
    target_thread_id: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  const {
    activeMemories,
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
    trimmedContent,
    existingMemories: smokeExistingMemories,
    existingMessages: (existingMessages ?? []) as Array<{
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
    }>,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });

  const ensuredUserMessage = await insertSmokeUserTurn({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    content: trimmedContent
  });

  await patchSmokeThreadAfterUserTurn({
    supabase: admin,
    threadId: thread.id,
    userId: smokeUser.id,
    title: thread.title,
    content: trimmedContent
  });

  const {
    createdTypes,
    smokeNickname,
    smokePreferredName,
    smokeUserAddressStyle
  } = await applySmokeTurnMemoryUpdates({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: ensuredAgent.id,
    sourceMessageId: ensuredUserMessage.id,
    trimmedContent,
    relationshipSeedMetadataBuilder: buildSmokeRelationshipSeedMetadata
  });
  const replyLanguageDecision = resolveSmokeReplyLanguage({
    content: trimmedContent,
    recentAssistantReply
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const effectiveAddressStyleValue =
    getSmokeRelationshipMemoryValue(addressStyleMemory);

  const assistantContent = buildSmokeAssistantReply({
    content: trimmedContent,
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

export { createSmokeLoginResponse };
