import {
  buildSmokeEnDefaultContinuationReply,
  buildSmokeZhDefaultContinuationReply
} from "@/lib/testing/smoke-continuation-replies";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeDefaultContinuationReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
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
