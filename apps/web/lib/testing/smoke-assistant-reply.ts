import type { SmokeAssistantReplyInput } from "@/lib/testing/smoke-assistant-reply-types";
import { buildSmokeFactReply } from "@/lib/testing/smoke-fact-replies";
import { buildSmokeGroundedReply } from "@/lib/testing/smoke-grounded-replies";
import { buildSmokeIntroReply } from "@/lib/testing/smoke-intro-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeQuickHelloReply } from "@/lib/testing/smoke-quick-hello-replies";
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
  const normalizedContent = normalizeSmokePrompt(content);
  const quickHelloReply = buildSmokeQuickHelloReply({
    normalizedContent,
    replyLanguage,
    modelProfileName
  });

  if (quickHelloReply) {
    return quickHelloReply;
  }

  const directIntroReply = buildSmokeIntroReply({
    content,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (directIntroReply) {
    return directIntroReply;
  }

  const factReply = buildSmokeFactReply({
    content,
    replyLanguage,
    normalizedContent,
    recalledMemories,
    addressStyleMemory
  });

  if (factReply) {
    return factReply;
  }

  const directOrGroundedReply = buildSmokeGroundedReply({
    content,
    answerStrategy,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    recalledMemories
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
