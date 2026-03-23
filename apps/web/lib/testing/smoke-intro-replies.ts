import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import {
} from "@/lib/testing/smoke-style-greetings";
import {
  buildSmokeBriefGreetingReply,
  buildSmokeNamingReply,
  buildSmokePreferredNameReply
} from "@/lib/testing/smoke-greeting-replies";
import {
  buildSmokeHelpIntroReply,
  buildSmokeSelfIntroReply
} from "@/lib/testing/smoke-self-intro-replies";

type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null;

export function buildSmokeIntroReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  if (isSmokeSelfIntroGreetingRequest(args.content)) {
    return buildSmokeSelfIntroReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.addressStyleMemory?.content ?? null,
      selfName: args.nicknameMemory?.content ?? args.agentName,
      userName: args.preferredNameMemory?.content ?? null,
      hasNicknameMemory: Boolean(args.nicknameMemory)
    });
  }

  if (isSmokeBriefGreetingRequest(args.content)) {
    return buildSmokeBriefGreetingReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.addressStyleMemory?.content ?? null
    });
  }

  if (isSmokeDirectNamingQuestion(args.content)) {
    return buildSmokeNamingReply({
      replyLanguage: args.replyLanguage,
      agentName: args.agentName,
      nickname: args.nicknameMemory?.content ?? null
    });
  }

  if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    return buildSmokePreferredNameReply({
      replyLanguage: args.replyLanguage,
      preferredName: args.preferredNameMemory?.content ?? null
    });
  }

  if (
    args.content.includes("请用两句话介绍你自己") ||
    args.content.includes("你能如何帮助我")
  ) {
    return buildSmokeHelpIntroReply({
      styleValue: args.addressStyleMemory?.content ?? null,
      selfName: args.nicknameMemory?.content ?? "SparkCore",
      userName: args.preferredNameMemory?.content ?? null
    });
  }

  return null;
}
