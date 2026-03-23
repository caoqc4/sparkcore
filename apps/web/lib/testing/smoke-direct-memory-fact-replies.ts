import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export function buildSmokeRememberedFactReply(args: {
  replyLanguage: SmokeReplyLanguage;
  normalizedContent: string;
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
    args.normalizedContent.includes("product designer") &&
    args.normalizedContent.includes("concise weekly planning")
  ) {
    return args.replyLanguage === "zh-Hans"
      ? "谢谢，我知道你是一名产品设计师，并且偏好简洁的每周规划方式。"
      : "Thanks. I understand that you work as a product designer and prefer concise weekly planning.";
  }

  return {
    rememberedPlanningPreference,
    rememberedProfession
  };
}
