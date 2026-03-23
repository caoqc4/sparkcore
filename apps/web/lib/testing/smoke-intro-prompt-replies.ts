import {
  buildSmokeBriefGreetingReply,
  buildSmokeNamingReply,
  buildSmokePreferredNameReply
} from "@/lib/testing/smoke-greeting-replies";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion
} from "@/lib/testing/smoke-answer-strategy";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeIntroPromptReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  styleValue: string | null;
  nickname: string | null;
  preferredName: string | null;
}) {
  if (isSmokeBriefGreetingRequest(args.content)) {
    return buildSmokeBriefGreetingReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.styleValue
    });
  }

  if (isSmokeDirectNamingQuestion(args.content)) {
    return buildSmokeNamingReply({
      replyLanguage: args.replyLanguage,
      agentName: args.agentName,
      nickname: args.nickname
    });
  }

  if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    return buildSmokePreferredNameReply({
      replyLanguage: args.replyLanguage,
      preferredName: args.preferredName
    });
  }

  return null;
}
