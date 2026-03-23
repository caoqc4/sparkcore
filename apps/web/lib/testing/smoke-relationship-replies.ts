import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply,
  buildSmokeRelationshipSupportiveCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
import { buildSmokeDefaultContinuationReply as buildSmokeDefaultContinuationReplyByLanguage } from "@/lib/testing/smoke-default-continuation-reply";
import { buildSmokeRelationshipSoftCatchReply } from "@/lib/testing/smoke-relationship-soft-catch";
import type {
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

type Args = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export function buildSmokeRelationshipExplanatoryReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: Args) {
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
}: Args) {
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
}: Omit<Args, "content" | "selfName">) {
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
}: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  return buildSmokeDefaultContinuationReplyByLanguage({
    content,
    replyLanguage,
    addressStyleValue,
    userName,
    recentAssistantReply
  });
}
