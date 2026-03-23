import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
import { buildSmokeDefaultContinuationReply as buildSmokeDefaultContinuationReplyByLanguage } from "@/lib/testing/smoke-default-continuation-reply";
import { buildSmokeRelationshipSupportiveReply as buildSmokeRelationshipSupportiveReplyByHelper } from "@/lib/testing/smoke-relationship-supportive-reply";
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

export function buildSmokeRelationshipSupportiveReply(
  args: SmokeRelationshipReplyArgs
) {
  return buildSmokeRelationshipSupportiveReplyByHelper(args);
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
  ...args
}: SmokeContinuationReplyArgs) {
  return buildSmokeDefaultContinuationReplyByLanguage(args);
}
