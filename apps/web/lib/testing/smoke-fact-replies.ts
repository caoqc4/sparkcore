import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion
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

export function buildSmokeFactReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  normalizedContent: string;
  recalledMemories: SmokeRecallMemory[];
  addressStyleMemory: SmokeRelationshipRecallMemory;
}) {
  const rememberedProfession = args.recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = args.recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  if (
    args.normalizedContent.includes("product designer") &&
    args.normalizedContent.includes("concise weekly planning")
  ) {
    return args.replyLanguage === "zh-Hans"
      ? "谢谢，我知道你是一名产品设计师，并且偏好简洁的每周规划方式。"
      : "Thanks. I understand that you work as a product designer and prefer concise weekly planning.";
  }

  if (isSmokeDirectProfessionQuestion(args.content)) {
    if (!rememberedProfession) {
      return args.replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return args.replyLanguage === "zh-Hans"
      ? "我记得你是一名产品设计师。"
      : "I remember that you work as a product designer.";
  }

  if (isSmokeDirectPlanningPreferenceQuestion(args.content)) {
    if (!rememberedPlanningPreference) {
      return args.replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return args.replyLanguage === "zh-Hans"
      ? "你偏好简洁的每周规划方式。"
      : "You prefer concise weekly planning.";
  }

  if (isSmokeDirectReplyStyleQuestion(args.content)) {
    const styleValue = args.addressStyleMemory?.content ?? null;

    if (!styleValue) {
      return args.replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    if (styleValue === "formal") {
      return args.replyLanguage === "zh-Hans"
        ? "你偏好我用更正式、更礼貌的方式回复你。"
        : "You prefer that I reply in a more formal, respectful way.";
    }

    if (styleValue === "friendly") {
      return args.replyLanguage === "zh-Hans"
        ? "你偏好我更像朋友一样和你说话。"
        : "You prefer that I speak to you in a more friendly, companion-like way.";
    }

    if (styleValue === "no_full_name") {
      return args.replyLanguage === "zh-Hans"
        ? "你偏好我不要用你的全名来称呼你。"
        : "You prefer that I avoid addressing you by your full name.";
    }

    return args.replyLanguage === "zh-Hans"
      ? "你偏好我用更轻松、不那么正式的方式回复你。"
      : "You prefer that I reply in a more casual, less formal way.";
  }

  return null;
}
