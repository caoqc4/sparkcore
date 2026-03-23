import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectReplyStyleQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { buildSmokeRememberedFactReply } from "@/lib/testing/smoke-direct-memory-fact-replies";
import { buildSmokeDirectReplyStyleReply } from "@/lib/testing/smoke-direct-style-replies";

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
  const rememberedFactReply = buildSmokeRememberedFactReply({
    replyLanguage: args.replyLanguage,
    normalizedContent: args.normalizedContent,
    recalledMemories: args.recalledMemories
  });
  if (typeof rememberedFactReply === "string") {
    return rememberedFactReply;
  }
  const { rememberedPlanningPreference, rememberedProfession } = rememberedFactReply;

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
    return buildSmokeDirectReplyStyleReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.addressStyleMemory?.content ?? null
    });
  }

  return null;
}
