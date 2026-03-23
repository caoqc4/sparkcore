import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import { isSmokeHelpIntroRequest } from "@/lib/testing/smoke-help-intro-prompts";
import { getSmokeIntroReplyContext } from "@/lib/testing/smoke-intro-reply-context";
import { buildSmokeIntroPromptReply } from "@/lib/testing/smoke-intro-prompt-replies";
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

  const promptReply = buildSmokeIntroPromptReply({
    content: args.content,
    replyLanguage: args.replyLanguage,
    agentName: args.agentName,
    styleValue: introContext.styleValue,
    nickname: introContext.nickname,
    preferredName: introContext.preferredName
  });
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
