import {
  buildSmokeEnDefaultContinuationReply,
  buildSmokeZhDefaultContinuationReply
} from "@/lib/testing/smoke-continuation-replies";
import type { SmokeDefaultContinuationReplyArgs } from "@/lib/testing/smoke-continuation-reply-types";

export function buildSmokeDefaultContinuationReply(
  args: SmokeDefaultContinuationReplyArgs
) {
  if (args.replyLanguage === "zh-Hans") {
    return buildSmokeZhDefaultContinuationReply({
      content: args.content,
      addressStyleValue: args.addressStyleValue,
      userName: args.userName,
      recentAssistantReply: args.recentAssistantReply
    });
  }

  return buildSmokeEnDefaultContinuationReply({
    content: args.content,
    addressStyleValue: args.addressStyleValue,
    userName: args.userName,
    recentAssistantReply: args.recentAssistantReply
  });
}
