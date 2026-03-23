import {
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipSupportivePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeEnDefaultContinuationReply,
  buildSmokeZhDefaultContinuationReply
} from "@/lib/testing/smoke-continuation-replies";
import { isSmokeOneLineSoftCatchPrompt } from "@/lib/testing/smoke-follow-up-prompts";
import {
  buildSmokeRelationshipExplanatoryCoreReply
} from "@/lib/testing/smoke-relationship-explanatory-core";
import { buildSmokeRelationshipClosingCoreReply } from "@/lib/testing/smoke-relationship-closing-core";
import type { SmokeRelationshipReplyInput } from "@/lib/testing/smoke-relationship-reply-types";
import { buildSmokeRelationshipSupportiveCoreReply } from "@/lib/testing/smoke-relationship-supportive-core";

function buildSmokeZhSoftCatchReply(userName: string | null) {
  return userName
    ? `${userName}，我在，先别一个人扛着。`
    : "我在，先别一个人扛着。";
}

function buildSmokeEnSoftCatchReply(userName: string | null) {
  return userName
    ? `${userName}, I am here, and you do not have to carry this alone.`
    : "I am here, and you do not have to carry this alone.";
}

export function buildSmokeRelationshipOrContinuationReply(
  args: SmokeRelationshipReplyInput
) {
  const addressStyleValue = args.addressStyleMemory?.content ?? null;
  const selfName = args.nicknameMemory?.content ?? args.agentName;
  const userName = args.preferredNameMemory?.content ?? null;

  if (isSmokeRelationshipExplanatoryPrompt(args.content)) {
    return buildSmokeRelationshipExplanatoryCoreReply({
      content: args.content,
      replyLanguage: args.replyLanguage,
      addressStyleValue,
      selfName,
      userName
    });
  }

  if (isSmokeRelationshipSupportivePrompt(args.content)) {
    if (isSmokeOneLineSoftCatchPrompt(args.content)) {
      return args.replyLanguage === "zh-Hans"
        ? buildSmokeZhSoftCatchReply(userName)
        : buildSmokeEnSoftCatchReply(userName);
    }

    return buildSmokeRelationshipSupportiveCoreReply({
      content: args.content,
      replyLanguage: args.replyLanguage,
      addressStyleValue,
      selfName,
      userName
    });
  }

  if (isSmokeRelationshipClosingPrompt(args.content)) {
    return buildSmokeRelationshipClosingCoreReply({
      replyLanguage: args.replyLanguage,
      addressStyleValue,
      userName
    });
  }

  if (args.replyLanguage === "zh-Hans") {
    return buildSmokeZhDefaultContinuationReply({
      content: args.content,
      addressStyleValue,
      userName,
      recentAssistantReply: args.recentAssistantReply
    });
  }

  return buildSmokeEnDefaultContinuationReply({
    content: args.content,
    addressStyleValue,
    userName,
    recentAssistantReply: args.recentAssistantReply
  });
}
