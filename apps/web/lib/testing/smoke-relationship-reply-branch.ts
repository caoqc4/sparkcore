import {
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipSupportivePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
import { buildSmokeDefaultContinuationReply } from "@/lib/testing/smoke-default-continuation-reply";
import { buildSmokeRelationshipReplyContext } from "@/lib/testing/smoke-relationship-reply-context";
import type { SmokeRelationshipReplyInput } from "@/lib/testing/smoke-relationship-reply-types";
import { buildSmokeRelationshipSupportiveReply } from "@/lib/testing/smoke-relationship-supportive-reply";

export function buildSmokeRelationshipOrContinuationReply(
  args: SmokeRelationshipReplyInput
) {
  const { addressStyleValue, selfName, userName } =
    buildSmokeRelationshipReplyContext(args);

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
    return buildSmokeRelationshipSupportiveReply({
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

  return buildSmokeDefaultContinuationReply({
    content: args.content,
    replyLanguage: args.replyLanguage,
    addressStyleValue,
    userName,
    recentAssistantReply: args.recentAssistantReply
  });
}
