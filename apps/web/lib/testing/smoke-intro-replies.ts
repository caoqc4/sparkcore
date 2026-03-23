import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeBriefGreetingReply,
  buildSmokeNamingReply,
  buildSmokePreferredNameReply
} from "@/lib/testing/smoke-greeting-replies";
import { isSmokeHelpIntroRequest } from "@/lib/testing/smoke-help-intro-prompts";
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

  if (isSmokeHelpIntroRequest(args.content)) {
    return buildSmokeHelpIntroReply({
      styleValue: introContext.styleValue,
      selfName: introContext.selfName,
      userName: introContext.userName
    });
  }

  return null;
}
