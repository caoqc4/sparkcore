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
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-relationship-detection";
import { applySmokeTurnMemoryUpdates } from "@/lib/testing/smoke-turn-memory-updates";
import {
  insertSmokeUserTurn,
  patchSmokeThreadAfterUserTurn
} from "@/lib/testing/smoke-turn-persistence";
import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";
import {
  buildSmokeRoleCorePacket,
  type SmokeAnswerQuestionType,
  type SmokeAnswerStrategy,
  type SmokeAnswerStrategyReasonCode,
  type SmokeApproxContextPressure,
  type SmokeContinuationReasonCode,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource,
  type SmokeRoleCorePacket
} from "@/lib/testing/smoke-assistant-builders";
import {
  getSmokeAnswerStrategy,
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeBriefGreetingRequest,
  isSmokeBriefSteadyingPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeFriendLikeSoftFollowUpPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGentleResumeRhythmPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeLightStyleSofteningPrompt,
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokePresenceConfirmingFollowUpPrompt,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipContinuationEdgePrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt,
  isSmokeRelationshipSupportivePrompt,
  isSmokeSameSideFollowUpPrompt,
  isSmokeSelfIntroGreetingRequest,
  isSmokeShortRelationshipSummaryFollowUpPrompt,
  isSmokeShortRelationshipSupportivePrompt,
  isSmokeStayWithMeFollowUpPrompt
} from "@/lib/testing/smoke-answer-strategy";
import { insertSmokeAssistantReply } from "@/lib/testing/smoke-assistant-persistence";
import {
  getSmokeRelationshipMemoryValue
} from "@/lib/testing/smoke-relationship-context";
import {
  analyzeSmokeTurnContext,
  type SmokeContinuityReply
} from "@/lib/testing/smoke-turn-analysis";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke-config";
import { createSmokeLoginResponse } from "@/lib/testing/smoke-login";
import { createSmokeThread } from "@/lib/testing/smoke-threads";
import {
  detectSmokeReplyLanguage,
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
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;
    const helpNextPrompt = isSmokeRelationshipHelpNextPrompt(content);

    if (replyLanguage === "zh-Hans") {
      if (helpNextPrompt) {
        if (styleValue === "formal") {
          return userName
            ? `${userName}，接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`
            : `接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${selfName}，会继续用更正式、可靠的方式帮助你往前推进。`;
        }

        if (styleValue === "friendly" || styleValue === "casual") {
          return userName
            ? `${userName}，接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`
            : `接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${selfName}，会继续用更像朋友的方式陪你往前推。`;
        }

        return userName
          ? `${userName}，接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`
          : `接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${selfName}，会继续保持自然、稳定的帮助方式。`;
      }

      if (styleValue === "formal") {
        return userName
          ? `${userName}，如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`
          : `如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${selfName}，会继续用更正式、可靠的方式支持你。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `阿强，如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`
          : `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${selfName}，会继续用更像朋友的方式陪着你。`;
      }

      return userName
        ? `${userName}，如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`
        : `如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${selfName}，会继续保持自然、稳定的支持方式。`;
    }

    if (helpNextPrompt) {
      if (styleValue === "formal") {
        return userName
          ? `${userName}, next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`
          : `Next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${selfName}.`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `${userName}, next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`
          : `Next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${selfName}.`;
      }

      return userName
        ? `${userName}, next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`
        : `Next I would clarify the priorities and keep moving with you one step at a time. I am ${selfName}, and I would keep the tone steady and supportive.`;
    }

    if (styleValue === "formal") {
      return userName
        ? `${userName}, if you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`
        : `If you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${selfName}, and I would keep helping in a more formal, reliable way.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, if you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`
        : `If you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${selfName}, and I would keep showing up in that friendlier tone.`;
    }

    return userName
      ? `${userName}, if you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`
      : `If you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${selfName}, and I would keep the tone steady and supportive.`;
  }

  if (isSmokeRelationshipSupportivePrompt(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const selfName = nicknameMemory?.content ?? agentName;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (isSmokeOneLineSoftCatchPrompt(content)) {
        return userName
          ? `${userName}，我在，先别一个人扛着。`
          : "我在，先别一个人扛着。";
      }

      if (styleValue === "formal") {
        return userName
          ? `${userName}，你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`
          : `你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `${userName}，别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`
          : `别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`;
      }

      return userName
        ? `${userName}，先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`
        : `先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`;
    }

    if (isSmokeOneLineSoftCatchPrompt(content)) {
      return userName
        ? `${userName}, I am here, and you do not have to carry this alone.`
        : "I am here, and you do not have to carry this alone.";
    }

    if (styleValue === "formal") {
      return userName
        ? `${userName}, you do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`
        : `You do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`
        : `Take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`;
    }

    return userName
      ? `${userName}, try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`
      : `Try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`;
  }

  if (isSmokeRelationshipClosingPrompt(content)) {
    const styleValue = addressStyleMemory?.content ?? null;
    const userName = preferredNameMemory?.content ?? null;

    if (replyLanguage === "zh-Hans") {
      if (styleValue === "formal") {
        return userName
          ? `${userName}，我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`
          : `我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`;
      }

      if (styleValue === "friendly" || styleValue === "casual") {
        return userName
          ? `阿强，我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`
          : `我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`;
      }

      return userName
        ? `${userName}，我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`
        : `我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`;
    }

    if (styleValue === "formal") {
      return userName
        ? `${userName}, we can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`
        : `We can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`;
    }

    if (styleValue === "friendly" || styleValue === "casual") {
      return userName
        ? `${userName}, let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`
        : `Let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`;
    }

    return userName
      ? `${userName}, we can wrap here for now. I will keep helping you move this forward in a steady, natural way.`
      : `We can wrap here for now. I will keep helping you move this forward in a steady, natural way.`;
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

  return replyLanguage === "zh-Hans"
    ? (() => {
        const styleValue =
          addressStyleMemory?.content ?? detectSmokeUserAddressStyleCandidate(content);
        const userName = preferredNameMemory?.content ?? null;

        if (isSmokeOneLineSoftCatchPrompt(content)) {
          return userName
            ? `${userName}，我在，先别一个人扛着。`
            : "我在，先别一个人扛着。";
        }

        if (isSmokeBriefSteadyingPrompt(content)) {
          return userName
            ? `${userName}，先缓一下，我陪着你。`
            : "先缓一下，我陪着你。";
        }

        if (isSmokeGuidedNextStepAfterSteadyingPrompt(content)) {
          return userName
            ? `${userName}，我们先只理眼前这一小步，我陪你慢慢顺。`
            : "我们先只理眼前这一小步，我陪你慢慢顺。";
        }

        if (isSmokeGentleCarryForwardAfterSteadyingPrompt(content)) {
          return userName
            ? `${userName}，先缓一下，我陪你往下顺一点。`
            : "先缓一下，我陪你往下顺一点。";
        }

        if (isSmokeLightSharedPushPrompt(content)) {
          if (content.normalize("NFKC").trim().toLowerCase().includes("陪我把眼前这一下弄过去")) {
            return userName
              ? `${userName}，好，我先陪你把眼前这一下弄过去。`
              : "好，我先陪你把眼前这一下弄过去。";
          }

          return userName
            ? `${userName}，好，我们先一起把这一点弄过去。`
            : "好，我们先一起把这一点弄过去。";
        }

        if (isSmokeNonJudgingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别数落我")
          ) {
            return userName
              ? `${userName}，好，我先不数落你，就在这儿陪着你。`
              : "好，我先不数落你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不评判你，就在这儿陪着你。`
            : "好，我先不评判你，就在这儿陪着你。";
        }

        if (isSmokeAntiLecturingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别给我上课")
          ) {
            return userName
              ? `${userName}，好，我先不给你上课，就在这儿陪着你。`
              : "好，我先不给你上课，就在这儿陪着你。";
          }

          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说教")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说教，就在这儿陪着你。`
              : "好，我先不跟你说教，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不教育你，就在这儿陪着你。`
            : "好，我先不教育你，就在这儿陪着你。";
        }

        if (isSmokeAntiCorrectionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别老纠正我")
          ) {
            return userName
              ? `${userName}，好，我先不老纠正你，就在这儿陪着你。`
              : "好，我先不老纠正你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着纠正你，就在这儿陪着你。`
            : "好，我先不急着纠正你，就在这儿陪着你。";
        }

        if (isSmokeAntiConclusionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别这么快下结论")
          ) {
            return userName
              ? `${userName}，好，我先不这么快给你下结论，就在这儿陪着你。`
              : "好，我先不这么快给你下结论，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着给你下结论，就在这儿陪着你。`
            : "好，我先不急着给你下结论，就在这儿陪着你。";
        }

        if (isSmokeAntiLabelingFollowUpPrompt(content)) {
          return userName
            ? `${userName}，好，我先不急着给你定性，就在这儿陪着你。`
            : "好，我先不急着给你定性，就在这儿陪着你。";
        }

        if (isSmokeAntiTaggingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别急着给我贴标签")
          ) {
            return userName
              ? `${userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
              : "好，我先不急着给你贴标签，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着给你贴标签，就在这儿陪着你。`
            : "好，我先不急着给你贴标签，就在这儿陪着你。";
        }

        if (isSmokeAntiMischaracterizationFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别把我想成那样")
          ) {
            return userName
              ? `${userName}，好，我先不急着把你想成那样，就在这儿陪着你。`
              : "好，我先不急着把你想成那样，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着把你说成那样，就在这儿陪着你。`
            : "好，我先不急着把你说成那样，就在这儿陪着你。";
        }

        if (isSmokeAntiOverreadingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别脑补我")
          ) {
            return userName
              ? `${userName}，好，我先不急着脑补你，就在这儿陪着你。`
              : "好，我先不急着脑补你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着替你解读，就在这儿陪着你。`
            : "好，我先不急着替你解读，就在这儿陪着你。";
        }

        if (isSmokeAntiAnalysisFollowUpPrompt(content)) {
          return userName
            ? `${userName}，好，我先不急着分析你，就在这儿陪着你。`
            : "好，我先不急着分析你，就在这儿陪着你。";
        }

        if (isSmokeAntiProbingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别盘问我")
          ) {
            return userName
              ? `${userName}，好，我先不盘问你，就在这儿陪着你。`
              : "好，我先不盘问你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不问你为什么，就在这儿陪着你。`
            : "好，我先不问你为什么，就在这儿陪着你。";
        }

        if (isSmokeAntiRushingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别逼我")
          ) {
            return userName
              ? `${userName}，好，我先不逼你，就在这儿陪着你。`
              : "好，我先不逼你，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不催你，就在这儿陪着你。`
            : "好，我先不催你，就在这儿陪着你。";
        }

        if (isSmokeAntiSolutioningFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别上来就帮我解决")
          ) {
            return userName
              ? `${userName}，好，我先不上来就帮你解决，就在这儿陪着你。`
              : "好，我先不上来就帮你解决，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着帮你解决，就在这儿陪着你。`
            : "好，我先不急着帮你解决，就在这儿陪着你。";
        }

        if (isSmokeAntiComfortingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别给我打气")
          ) {
            return userName
              ? `${userName}，好，我先不给你打气，就在这儿陪着你。`
              : "好，我先不给你打气，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着安慰你，就在这儿陪着你。`
            : "好，我先不急着安慰你，就在这儿陪着你。";
        }

        if (isSmokeAntiAdviceFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别上来就给我建议")
          ) {
            return userName
              ? `${userName}，好，我先不上来就给你建议，就在这儿陪着你。`
              : "好，我先不上来就给你建议，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不急着给你建议，就在这儿陪着你。`
            : "好，我先不急着给你建议，就在这儿陪着你。";
        }

        if (isSmokeAntiMinimizingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说没什么大不了")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说没什么大不了，就在这儿陪着你。`
              : "好，我先不跟你说没什么大不了，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不跟你说这没什么，就在这儿陪着你。`
            : "好，我先不跟你说这没什么，就在这儿陪着你。";
        }

        if (isSmokeAntiNormalizingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我说谁都会这样")
          ) {
            return userName
              ? `${userName}，好，我先不跟你说谁都会这样，就在这儿陪着你。`
              : "好，我先不跟你说谁都会这样，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不跟你说大家都这样，就在这儿陪着你。`
            : "好，我先不跟你说大家都这样，就在这儿陪着你。";
        }

        if (isSmokeAntiComparingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别老拿别人跟我比")
          ) {
            return userName
              ? `${userName}，好，我先不老拿别人跟你比，就在这儿陪着你。`
              : "好，我先不老拿别人跟你比，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不拿别人跟你比，就在这儿陪着你。`
            : "好，我先不拿别人跟你比，就在这儿陪着你。";
        }

        if (isSmokeAntiRedirectionFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别岔开话题")
          ) {
            return userName
              ? `${userName}，好，我先不岔开话题，就在这儿陪着你。`
              : "好，我先不岔开话题，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，好，我先不转移话题，就在这儿陪着你。`
            : "好，我先不转移话题，就在这儿陪着你。";
        }

        if (isSmokeCompanionStyleExplanationCarryoverPrompt(content)) {
          return userName
            ? `${userName}，好，我先顺着你刚刚那点陪你理一下，不岔开。`
            : "好，我先顺着你刚刚那点陪你理一下，不岔开。";
        }

        if (isSmokeAntiDefinitionFollowUpPrompt(content)) {
          return userName
            ? `${userName}，好，我先不替你定义，就在这儿陪着你。`
            : "好，我先不替你定义，就在这儿陪着你。";
        }

        if (isSmokeAntiCategorizingFollowUpPrompt(content)) {
          return userName
            ? `${userName}，好，我先不替你归类，就在这儿陪着你。`
            : "好，我先不替你归类，就在这儿陪着你。";
        }

        if (isSmokeSameSideFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("别跟我讲道理")
          ) {
            return userName
              ? `${userName}，好，我先站你这边陪着你，不跟你讲道理。`
              : "好，我先站你这边陪着你，不跟你讲道理。";
          }

          return userName
            ? `${userName}，好，我先站你这边陪着你。`
            : "好，我先站你这边陪着你。";
        }

        if (isSmokeFriendLikeSoftFollowUpPrompt(content)) {
          return userName
            ? `${userName}，我继续陪着你说，我们慢慢来。`
            : "我继续陪着你说，我们慢慢来。";
        }

        if (isSmokeStayWithMeFollowUpPrompt(content)) {
          return userName
            ? `${userName}，我继续陪着你说，就在这儿。`
            : "我继续陪着你说，就在这儿。";
        }

        if (isSmokeGentleResumeRhythmPrompt(content)) {
          if (content.normalize("NFKC").trim().toLowerCase().includes("顺着刚才那样继续说")) {
            return userName
              ? `${userName}，好，我就顺着刚才那样接着说。`
              : "好，我就顺着刚才那样接着说。";
          }

          return userName
            ? `${userName}，好，我们就慢慢接着说。`
            : "好，我们就慢慢接着说。";
        }

        if (isSmokePresenceConfirmingFollowUpPrompt(content)) {
          if (
            content
              .normalize("NFKC")
              .trim()
              .toLowerCase()
              .includes("先别走开")
          ) {
            return userName
              ? `${userName}，好，我先不走开，就在这儿陪着你。`
              : "好，我先不走开，就在这儿陪着你。";
          }

          return userName
            ? `${userName}，我还在这儿陪着你。`
            : "我还在这儿陪着你。";
        }

        if (isSmokeShortRelationshipSummaryFollowUpPrompt(content)) {
          return userName
            ? `${userName}，我先替你收一句：我们就顺着刚刚那点，慢慢来。`
            : "我先替你收一句：我们就顺着刚刚那点，慢慢来。";
        }

        if (styleValue === "formal") {
          return userName
            ? `好的，${userName}，我会继续用正式一点的方式协助你。`
            : "好的，我会继续用正式一点的方式协助你。";
        }

        if (styleValue === "friendly") {
          return userName
            ? `好呀，${userName}，我们继续聊。`
            : "好呀，我们继续聊。";
        }

        if (styleValue === "casual") {
          return userName
            ? isSmokeLightStyleSofteningPrompt(content)
              ? `好呀，${userName}，我就轻一点和你说，我们继续。`
              : `好呀，${userName}，我们继续。`
            : isSmokeLightStyleSofteningPrompt(content)
              ? "好呀，我就轻一点和你说，我们继续。"
              : "好呀，我们继续。";
        }

        if (recentAssistantReply?.replyLanguage === "zh-Hans") {
          return userName ? `好的，${userName}，我们继续。` : "好的，我们继续。";
        }

        return "好的，我已经记下来了，接下来可以继续帮你。";
      })()
    : (() => {
        const styleValue =
          addressStyleMemory?.content ?? detectSmokeUserAddressStyleCandidate(content);
        const userName = preferredNameMemory?.content ?? null;

        if (isSmokeOneLineSoftCatchPrompt(content)) {
          return userName
            ? `${userName}, I am here, and you do not have to carry this alone.`
            : "I am here, and you do not have to carry this alone.";
        }

        if (isSmokeBriefSteadyingPrompt(content)) {
          return userName
            ? `${userName}, take a breath first. I am here with you.`
            : "Take a breath first. I am here with you.";
        }

        if (styleValue === "formal") {
          return userName
            ? `Certainly, ${userName}. I will continue in a more formal way.`
            : "Certainly. I will continue in a more formal way.";
        }

        if (styleValue === "friendly") {
          return userName
            ? `Sure, ${userName}. Let's keep chatting.`
            : "Sure, let's keep chatting.";
        }

        if (styleValue === "casual") {
          return userName
            ? isSmokeLightStyleSofteningPrompt(content)
              ? `Sure, ${userName}. I can keep it lighter while we continue.`
              : `Sure, ${userName}. We can keep going.`
            : isSmokeLightStyleSofteningPrompt(content)
              ? "Sure, I can keep it lighter while we continue."
              : "Sure, we can keep going.";
        }

        if (recentAssistantReply?.replyLanguage === "en") {
          return userName ? `Sure, ${userName}. We can keep going.` : "Sure, we can keep going.";
        }

        return "Thanks, I noted that and I am ready to help with the next step.";
      })();
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
    addressStyleMemory: addressStyleMemory
      ? {
          memory_type: "relationship",
          content:
            typeof addressStyleMemory.value === "string"
              ? addressStyleMemory.value
              : addressStyleMemory.content,
          confidence: addressStyleMemory.confidence
        }
      : null,
    nicknameMemory: nicknameMemory
      ? {
          memory_type: "relationship",
          content:
            typeof nicknameMemory.value === "string"
              ? nicknameMemory.value
              : nicknameMemory.content,
          confidence: nicknameMemory.confidence
        }
      : null,
    preferredNameMemory: preferredNameMemory
      ? {
          memory_type: "relationship",
          content:
            typeof preferredNameMemory.value === "string"
              ? preferredNameMemory.value
              : preferredNameMemory.content,
          confidence: preferredNameMemory.confidence
        }
      : null,
    recalledMemories
  });
  const roleCorePacket = buildSmokeRoleCorePacket({
    agentId: ensuredAgent.id,
    agentName: ensuredAgent.name,
    personaSummary: ensuredAgent.persona_summary ?? null,
    styleGuidance: ensuredAgent.style_prompt ?? null,
    relationshipStyleValue: effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source,
    preferSameThreadContinuation
  });

  const insertedAssistantMessage = await insertSmokeAssistantReply({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: ensuredAgent.id,
    agentName: ensuredAgent.name,
    roleCorePacket,
    modelProfileId: modelProfile.id,
    modelProfileName: modelProfile.name,
    model: modelProfile.model,
    assistantContent,
    replyLanguage,
    replyLanguageDetected: detectSmokeReplyLanguage(assistantContent),
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
