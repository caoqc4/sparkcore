import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
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
import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeRelationshipOrContinuationReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  const addressStyleValue = args.addressStyleMemory?.content ?? null;
  const selfName = args.nicknameMemory?.content ?? args.agentName;
  const userName = args.preferredNameMemory?.content ?? null;

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
