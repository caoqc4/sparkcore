import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeQuickHelloReply(args: {
  normalizedContent: string;
  replyLanguage: SmokeReplyLanguage;
  modelProfileName: string;
}) {
  if (!args.normalizedContent.includes("reply in one sentence with a quick hello")) {
    return null;
  }

  return args.replyLanguage === "zh-Hans"
    ? `你好，我是通过 ${args.modelProfileName} 回复的 SparkCore。`
    : `Hello from SparkCore via ${args.modelProfileName}.`;
}
