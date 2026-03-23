import {
  buildSmokeBriefGreetingReply,
  buildSmokeNamingReply,
  buildSmokePreferredNameReply
} from "@/lib/testing/smoke-greeting-replies";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import { isSmokeHelpIntroRequest } from "@/lib/testing/smoke-help-intro-prompts";
import { getSmokeIntroReplyContext } from "@/lib/testing/smoke-intro-reply-context";
import type { SmokeIntroReplyInput } from "@/lib/testing/smoke-intro-reply-types";
import {
  buildSmokeHelpIntroReply,
  buildSmokeSelfIntroReply
} from "@/lib/testing/smoke-self-intro-replies";

export function buildSmokeIntroReply(args: SmokeIntroReplyInput) {
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

  let promptReply: string | null = null;

  if (isSmokeBriefGreetingRequest(args.content)) {
    promptReply = buildSmokeBriefGreetingReply({
      replyLanguage: args.replyLanguage,
      styleValue: introContext.styleValue
    });
  } else if (isSmokeDirectNamingQuestion(args.content)) {
    promptReply = buildSmokeNamingReply({
      replyLanguage: args.replyLanguage,
      agentName: args.agentName,
      nickname: introContext.nickname
    });
  } else if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    promptReply = buildSmokePreferredNameReply({
      replyLanguage: args.replyLanguage,
      preferredName: introContext.preferredName
    });
  }

  if (promptReply) {
    return promptReply;
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
