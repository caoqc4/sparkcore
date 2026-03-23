import { isSmokeOneLineSoftCatchPrompt } from "@/lib/testing/smoke-follow-up-prompts";
import {
  buildSmokeRelationshipClosingCoreReply,
  buildSmokeRelationshipExplanatoryCoreReply,
  buildSmokeRelationshipSupportiveCoreReply
} from "@/lib/testing/smoke-relationship-core-replies";
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
      return userName
        ? `${userName}，我在，先别一个人扛着。`
        : "我在，先别一个人扛着。";
    }
  }

  if (isSmokeOneLineSoftCatchPrompt(content)) {
    return userName
      ? `${userName}, I am here, and you do not have to carry this alone.`
      : "I am here, and you do not have to carry this alone.";
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
