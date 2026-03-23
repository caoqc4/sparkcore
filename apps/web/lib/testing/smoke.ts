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
  const normalized = content.toLowerCase();
  const rememberedProfession = recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  if (normalized.includes("reply in one sentence with a quick hello")) {
    return replyLanguage === "zh-Hans"
      ? `你好，我是通过 ${modelProfileName} 回复的 SparkCore。`
      : `Hello from SparkCore via ${modelProfileName}.`;
  }

  if (isSmokeSelfIntroGreetingRequest(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      const greeting =
        styleValue === "formal"
          ? userName
            ? `您好，${userName}。`
            : "您好。"
          : styleValue === "friendly"
            ? userName
              ? `嗨，${userName}。`
              : "嗨，朋友。"
            : styleValue === "casual"
              ? userName
                ? `嗨，${userName}。`
                : "嗨。"
              : userName
                ? `你好，${userName}。`
                : "你好。";

      const intro =
        nicknameMemory || styleValue === "friendly"
          ? `我是${selfName}，很高兴继续和你聊。`
          : `我是${selfName}，很高兴继续为你提供帮助。`;

      return `${greeting} ${intro}`;
    }

    const greeting =
      styleValue === "formal"
        ? userName
          ? `Hello, ${userName}.`
          : "Hello."
        : styleValue === "friendly"
          ? userName
            ? `Hey, ${userName}.`
            : "Hey, friend."
          : styleValue === "casual"
            ? userName
              ? `Hey, ${userName}.`
              : "Hey."
            : userName
              ? `Hello, ${userName}.`
              : "Hello.";

    const intro =
      nicknameMemory || styleValue === "friendly"
        ? `I am ${selfName}, and it is good to keep chatting with you.`
        : `I am ${selfName}, and I am glad to keep helping you.`;

    return `${greeting} ${intro}`;
  }

  if (isSmokeBriefGreetingRequest(content)) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (styleValue === "formal") {
      return replyLanguage === "zh-Hans"
        ? "您好，很高兴继续为您提供帮助。"
        : "Hello, I am glad to continue assisting you.";
    }

    if (styleValue === "friendly") {
      return replyLanguage === "zh-Hans"
        ? "嗨，朋友，很高兴又见到你。"
        : "Hey friend, it is good to see you again.";
    }

    if (styleValue === "casual") {
      return replyLanguage === "zh-Hans"
        ? "嗨，很高兴继续和你聊。"
        : "Hey, good to keep chatting with you.";
    }

    return replyLanguage === "zh-Hans"
      ? "你好，很高兴见到你。"
      : "Hello, it is good to see you.";
  }

  if (
    normalized.includes("product designer") &&
    normalized.includes("concise weekly planning")
  ) {
    return replyLanguage === "zh-Hans"
      ? "谢谢，我知道你是一名产品设计师，并且偏好简洁的每周规划方式。"
      : "Thanks. I understand that you work as a product designer and prefer concise weekly planning.";
  }

  if (isSmokeDirectProfessionQuestion(content)) {
    if (!rememberedProfession) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return replyLanguage === "zh-Hans"
      ? "我记得你是一名产品设计师。"
      : "I remember that you work as a product designer.";
  }

  if (isSmokeDirectPlanningPreferenceQuestion(content)) {
    if (!rememberedPlanningPreference) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return replyLanguage === "zh-Hans"
      ? "你偏好简洁的每周规划方式。"
      : "You prefer concise weekly planning.";
  }

  if (isSmokeDirectReplyStyleQuestion(content)) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (!styleValue) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    if (styleValue === "formal") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我用更正式、更礼貌的方式回复你。"
        : "You prefer that I reply in a more formal, respectful way.";
    }

    if (styleValue === "friendly") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我更像朋友一样和你说话。"
        : "You prefer that I speak to you in a more friendly, companion-like way.";
    }

    if (styleValue === "no_full_name") {
      return replyLanguage === "zh-Hans"
        ? "你偏好我不要用你的全名来称呼你。"
        : "You prefer that I avoid addressing you by your full name.";
    }

    return replyLanguage === "zh-Hans"
      ? "你偏好我用更轻松、不那么正式的方式回复你。"
      : "You prefer that I reply in a more casual, less formal way.";
  }

  if (
    answerStrategy === "grounded-open-ended-advice" &&
    isSmokeOpenEndedPlanningHelpQuestion(content)
  ) {
    const styleValue = addressStyleMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      const opening =
        styleValue === "formal"
          ? "好的，我会更正式一点地来帮你梳理。"
          : styleValue === "friendly"
            ? "好呀，我会更像朋友一样陪你一起梳理。"
            : "好呀，我来帮你一起理一理。";

      if (rememberedProfession && rememberedPlanningPreference) {
        return `${opening} 结合我记得的内容，你是一名产品设计师，也偏好简洁的每周规划方式，所以我会先帮你收拢本周最重要的三件事，再把它们拆成清晰的下一步。`;
      }

      if (rememberedPlanningPreference) {
        return `${opening} 我会按你偏好的简洁每周规划方式，先收拢重点，再拆出最清晰的下一步。`;
      }

      return `${opening} 我会先帮你抓住本周重点，再整理出一份简洁可执行的周计划。`;
    }

    const opening =
      styleValue === "formal"
        ? "Certainly. I will take a more formal approach here."
        : styleValue === "friendly"
          ? "Absolutely. I can take a more friendly, companion-like approach here."
          : "Sure, I can help you sort it out.";

    if (rememberedProfession && rememberedPlanningPreference) {
      return `${opening} Based on what I remember, you work as a product designer and prefer concise weekly planning, so I would start with your top three priorities and turn them into clear next steps.`;
    }

    if (rememberedPlanningPreference) {
      return `${opening} I would use your preference for concise weekly planning to narrow the week to the clearest priorities and next steps.`;
    }

    return `${opening} I would start by identifying the week's priorities and turning them into a short, actionable plan.`;
  }

  if (
    answerStrategy === "grounded-open-ended-summary" &&
    isSmokeOpenEndedSummaryQuestion(content)
  ) {
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (rememberedProfession && userName) {
        return `我记得你叫${userName}，是一名产品设计师。现在由${selfName}继续陪你把事情往前推进。`;
      }

      if (rememberedProfession) {
        return `我记得你是一名产品设计师，现在由${selfName}继续陪你把事情往前推进。`;
      }

      return `现在由${selfName}继续陪你往前推进，我会结合已经记得的内容来帮助你。`;
    }

    if (rememberedProfession && userName) {
      return `I remember that you go by ${userName} and work as a product designer. ${selfName} can keep helping you move things forward from here.`;
    }

    if (rememberedProfession) {
      return `I remember that you work as a product designer. ${selfName} can keep helping you move things forward from here.`;
    }

    return `${selfName} can keep helping you move things forward from here with the context already remembered.`;
  }

  if (isSmokeDirectNamingQuestion(content)) {
    if (nicknameMemory) {
      return replyLanguage === "zh-Hans"
        ? `哈哈，我叫${nicknameMemory.content}！`
        : `You can call me ${nicknameMemory.content}.`;
    }

    return replyLanguage === "zh-Hans"
      ? `我叫${agentName}。`
      : `My name is ${agentName}.`;
  }

  if (isSmokeDirectUserPreferredNameQuestion(content)) {
    if (preferredNameMemory) {
      return replyLanguage === "zh-Hans"
        ? `我应该叫你${preferredNameMemory.content}。`
        : `I should call you ${preferredNameMemory.content}.`;
    }

    return replyLanguage === "zh-Hans"
      ? "我还没有记住你偏好的称呼。"
      : "I have not stored your preferred name yet.";
  }

  if (
    content.includes("请用两句话介绍你自己") ||
    content.includes("你能如何帮助我")
  ) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? "SparkCore";
    const userName = preferredNameMemory?.content ?? null;
    const opening =
      styleValue === "formal"
        ? userName
          ? `您好，${userName}。`
          : "您好。"
        : styleValue === "friendly"
          ? userName
            ? `嗨，${userName}。`
            : "嗨，朋友。"
          : styleValue === "casual"
            ? userName
              ? `嗨，${userName}。`
              : "嗨。"
            : userName
              ? `你好，${userName}。`
              : "你好。";

    return `${opening} 我是${selfName}，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。`;
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

  if (
    normalized.includes("please introduce yourself in two short sentences") ||
    normalized.includes("explain how you can help me")
  ) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? "SparkCore";
    const userName = preferredNameMemory?.content ?? null;
    const opening =
      styleValue === "formal"
        ? userName
          ? `Hello, ${userName}.`
          : "Hello."
        : styleValue === "friendly"
          ? userName
            ? `Hey, ${userName}.`
            : "Hey, friend."
          : styleValue === "casual"
            ? userName
              ? `Hey, ${userName}.`
              : "Hey."
            : userName
              ? `Hello, ${userName}.`
              : "Hello.";

    return `${opening} I am ${selfName}, and I can help you organize plans, reuse memory, and continue conversations across threads.`;
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
