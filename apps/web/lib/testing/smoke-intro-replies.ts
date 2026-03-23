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
import { getSmokeIntroReplyContext } from "@/lib/testing/smoke-intro-reply-context";
import {
  buildSmokeHelpIntroReply,
  buildSmokeSelfIntroReply
} from "@/lib/testing/smoke-self-intro-replies";
import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export function buildSmokeIntroReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  const introContext = getSmokeIntroReplyContext({
    agentName: args.agentName,
    addressStyleMemory: args.addressStyleMemory,
    nicknameMemory: args.nicknameMemory,
    preferredNameMemory: args.preferredNameMemory
  });

  if (isSmokeSelfIntroGreetingRequest(args.content)) {
    return buildSmokeSelfIntroReply({
      replyLanguage: args.replyLanguage,
      styleValue: introContext.styleValue,
      selfName: introContext.selfName,
      userName: introContext.userName,
      hasNicknameMemory: introContext.hasNicknameMemory
    });
  }

  if (isSmokeBriefGreetingRequest(args.content)) {
    return buildSmokeBriefGreetingReply({
      replyLanguage: args.replyLanguage,
      styleValue: introContext.styleValue
    });
  }

  if (isSmokeDirectNamingQuestion(args.content)) {
    return buildSmokeNamingReply({
      replyLanguage: args.replyLanguage,
      agentName: args.agentName,
      nickname: introContext.nickname
    });
  }

  if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    return buildSmokePreferredNameReply({
      replyLanguage: args.replyLanguage,
      preferredName: introContext.preferredName
    });
  }

  if (
    args.content.includes("请用两句话介绍你自己") ||
    args.content.includes("你能如何帮助我")
  ) {
    return buildSmokeHelpIntroReply({
      styleValue: introContext.styleValue,
      selfName: introContext.selfName,
      userName: introContext.userName
    });
  }

  return null;
}
