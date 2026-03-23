import type { SmokeAssistantReplyInput } from "@/lib/testing/smoke-assistant-reply-types";
import { buildSmokeDirectOrGroundedReply } from "@/lib/testing/smoke-direct-replies";
import { buildSmokeRelationshipOrContinuationReply } from "@/lib/testing/smoke-relationship-reply-branch";

export function buildSmokeAssistantReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
  recentAssistantReply,
  recalledMemories,
  agentName,
  addressStyleMemory,
  nicknameMemory,
  preferredNameMemory
}: SmokeAssistantReplyInput) {
  const directOrGroundedReply = buildSmokeDirectOrGroundedReply({
    content,
    answerStrategy,
    modelProfileName,
    replyLanguage,
    recalledMemories,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (directOrGroundedReply) {
    return directOrGroundedReply;
  }

  return buildSmokeRelationshipOrContinuationReply({
    content,
    replyLanguage,
    recentAssistantReply,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });
}
