import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeGroundedPlanningReply(args: {
  replyLanguage: SmokeReplyLanguage;
  styleValue: string | null;
  rememberedProfession: boolean;
  rememberedPlanningPreference: boolean;
}) {
  if (args.replyLanguage === "zh-Hans") {
    const opening =
      args.styleValue === "formal"
        ? "好的，我会更正式一点地来帮你梳理。"
        : args.styleValue === "friendly"
          ? "好呀，我会更像朋友一样陪你一起梳理。"
          : "好呀，我来帮你一起理一理。";

    if (args.rememberedProfession && args.rememberedPlanningPreference) {
      return `${opening} 结合我记得的内容，你是一名产品设计师，也偏好简洁的每周规划方式，所以我会先帮你收拢本周最重要的三件事，再把它们拆成清晰的下一步。`;
    }

    if (args.rememberedPlanningPreference) {
      return `${opening} 我会按你偏好的简洁每周规划方式，先收拢重点，再拆出最清晰的下一步。`;
    }

    return `${opening} 我会先帮你抓住本周重点，再整理出一份简洁可执行的周计划。`;
  }

  const opening =
    args.styleValue === "formal"
      ? "Certainly. I will take a more formal approach here."
      : args.styleValue === "friendly"
        ? "Absolutely. I can take a more friendly, companion-like approach here."
        : "Sure, I can help you sort it out.";

  if (args.rememberedProfession && args.rememberedPlanningPreference) {
    return `${opening} Based on what I remember, you work as a product designer and prefer concise weekly planning, so I would start with your top three priorities and turn them into clear next steps.`;
  }

  if (args.rememberedPlanningPreference) {
    return `${opening} I would use your preference for concise weekly planning to narrow the week to the clearest priorities and next steps.`;
  }

  return `${opening} I would start by identifying the week's priorities and turning them into a short, actionable plan.`;
}
