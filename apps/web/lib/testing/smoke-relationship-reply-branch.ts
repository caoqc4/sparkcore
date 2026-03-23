import {
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipSupportivePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeDefaultContinuationReply,
  buildSmokeRelationshipClosingReply,
  buildSmokeRelationshipExplanatoryReply,
  buildSmokeRelationshipSupportiveReply
} from "@/lib/testing/smoke-relationship-replies";
import { buildSmokeRelationshipReplyContext } from "@/lib/testing/smoke-relationship-reply-context";
import type { SmokeRelationshipReplyInput } from "@/lib/testing/smoke-relationship-reply-types";

export function buildSmokeRelationshipOrContinuationReply(
  args: SmokeRelationshipReplyInput
) {
  const { addressStyleValue, selfName, userName } =
    buildSmokeRelationshipReplyContext(args);

  if (isSmokeRelationshipExplanatoryPrompt(args.content)) {
    return buildSmokeRelationshipExplanatoryReply({
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
    return buildSmokeRelationshipClosingReply({
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
