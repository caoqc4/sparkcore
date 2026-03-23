import { isSmokeOneLineSoftCatchPrompt } from "@/lib/testing/smoke-follow-up-prompts";
import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply,
  buildSmokeRelationshipSupportiveCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
import {
  buildSmokeEnSoftCatchReply,
  buildSmokeZhSoftCatchReply
} from "@/lib/testing/smoke-soft-catch-replies";
import {
  buildSmokeEnDefaultContinuationReply,
  buildSmokeZhDefaultContinuationReply
} from "@/lib/testing/smoke-continuation-replies";
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
  if (replyLanguage === "zh-Hans") {
    if (isSmokeOneLineSoftCatchPrompt(content)) {
      return buildSmokeZhSoftCatchReply(userName);
    }
  }

  if (isSmokeOneLineSoftCatchPrompt(content)) {
    return buildSmokeEnSoftCatchReply(userName);
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
  if (replyLanguage === "zh-Hans") {
    return buildSmokeZhDefaultContinuationReply({
      content,
      addressStyleValue,
      userName,
      recentAssistantReply
    });
  }

  return buildSmokeEnDefaultContinuationReply({
    content,
    addressStyleValue,
    userName,
    recentAssistantReply
  });
}
