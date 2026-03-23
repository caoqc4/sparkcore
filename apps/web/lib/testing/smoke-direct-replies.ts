import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeIntroReply } from "@/lib/testing/smoke-intro-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import {
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";

type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null;

type SmokeRecallMemory = {
  memory_type: "profile" | "preference" | "relationship";
  content: string;
  confidence: number;
};

export function buildSmokeDirectOrGroundedReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
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
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
}) {
  const normalized = normalizeSmokePrompt(content);
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

  const introReply = buildSmokeIntroReply({
    content,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (introReply) {
    return introReply;
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

  return null;
}
