import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply,
  buildSmokeRelationshipSupportiveCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
import { buildSmokeDefaultContinuationReply as buildSmokeDefaultContinuationReplyByLanguage } from "@/lib/testing/smoke-default-continuation-reply";
import { buildSmokeRelationshipSoftCatchReply } from "@/lib/testing/smoke-relationship-soft-catch";
import type {
  SmokeContinuationReplyArgs,
  SmokeRelationshipReplyArgs
} from "@/lib/testing/smoke-relationship-reply-types";

export function buildSmokeRelationshipExplanatoryReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: SmokeRelationshipReplyArgs) {
  return buildSmokeRelationshipExplanatoryCoreReply({
    content,
    replyLanguage,
    addressStyleValue,
    selfName,
    userName
  });
}

export function buildSmokeRelationshipSupportiveReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: SmokeRelationshipReplyArgs) {
  const softCatchReply = buildSmokeRelationshipSoftCatchReply({
    content,
    replyLanguage,
    userName
  });
  if (softCatchReply) {
    return softCatchReply;
  }

  return buildSmokeRelationshipSupportiveCoreReply({
    content,
    replyLanguage,
    addressStyleValue,
    selfName,
    userName
  });
}

export function buildSmokeRelationshipClosingReply({
  replyLanguage,
  addressStyleValue,
  userName
}: Omit<SmokeRelationshipReplyArgs, "content" | "selfName">) {
  return buildSmokeRelationshipClosingCoreReply({
    replyLanguage,
    addressStyleValue,
    userName
  });
}

export function buildSmokeDefaultContinuationReply({
  content,
  replyLanguage,
  addressStyleValue,
  userName,
  recentAssistantReply
}: SmokeContinuationReplyArgs) {
  return buildSmokeDefaultContinuationReplyByLanguage({
    content,
    replyLanguage,
    addressStyleValue,
    userName,
    recentAssistantReply
  });
}
