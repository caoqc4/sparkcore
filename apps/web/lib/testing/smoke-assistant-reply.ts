import type { SmokeAssistantReplyInput } from "@/lib/testing/smoke-assistant-reply-types";
import { buildSmokeDirectFactOrGroundedReply } from "@/lib/testing/smoke-direct-fact-grounded-replies";
import { buildSmokeDirectIntroReply } from "@/lib/testing/smoke-direct-intro-replies";
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
  const directIntroReply = buildSmokeDirectIntroReply({
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

  if (directIntroReply) {
    return directIntroReply;
  }

  const directOrGroundedReply = buildSmokeDirectFactOrGroundedReply({
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
