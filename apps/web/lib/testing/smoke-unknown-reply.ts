import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeUnknownReply(replyLanguage: SmokeReplyLanguage) {
  return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
}
