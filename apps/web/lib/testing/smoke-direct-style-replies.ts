import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeUnknownReply } from "@/lib/testing/smoke-unknown-reply";

export function buildSmokeDirectReplyStyleReply(args: {
  replyLanguage: SmokeReplyLanguage;
  styleValue: string | null;
}) {
  if (!args.styleValue) {
    return buildSmokeUnknownReply(args.replyLanguage);
  }

  if (args.styleValue === "formal") {
    return args.replyLanguage === "zh-Hans"
      ? "你偏好我用更正式、更礼貌的方式回复你。"
      : "You prefer that I reply in a more formal, respectful way.";
  }

  if (args.styleValue === "friendly") {
    return args.replyLanguage === "zh-Hans"
      ? "你偏好我更像朋友一样和你说话。"
      : "You prefer that I speak to you in a more friendly, companion-like way.";
  }

  if (args.styleValue === "no_full_name") {
    return args.replyLanguage === "zh-Hans"
      ? "你偏好我不要用你的全名来称呼你。"
      : "You prefer that I avoid addressing you by your full name.";
  }

  return args.replyLanguage === "zh-Hans"
    ? "你偏好我用更轻松、不那么正式的方式回复你。"
    : "You prefer that I reply in a more casual, less formal way.";
}
