import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import {
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

export function buildSmokeGroundedReply(args: {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
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
    args.answerStrategy === "grounded-open-ended-advice" &&
    isSmokeOpenEndedPlanningHelpQuestion(args.content)
  ) {
    const styleValue = args.addressStyleMemory?.content ?? null;

    if (args.replyLanguage === "zh-Hans") {
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
    args.answerStrategy === "grounded-open-ended-summary" &&
    isSmokeOpenEndedSummaryQuestion(args.content)
  ) {
    const selfName = args.nicknameMemory?.content ?? args.agentName;
    const userName = args.preferredNameMemory?.content ?? null;

    if (args.replyLanguage === "zh-Hans") {
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
