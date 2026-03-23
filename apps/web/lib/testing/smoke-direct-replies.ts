import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeFactReply } from "@/lib/testing/smoke-fact-replies";
import { buildSmokeGroundedReply } from "@/lib/testing/smoke-grounded-replies";
import { buildSmokeIntroReply } from "@/lib/testing/smoke-intro-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeQuickHelloReply } from "@/lib/testing/smoke-quick-hello-replies";
import type { SmokeDirectOrGroundedReplyArgs } from "@/lib/testing/smoke-direct-reply-types";

export function buildSmokeDirectOrGroundedReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
  recalledMemories,
  agentName,
  addressStyleMemory,
  nicknameMemory,
  preferredNameMemory
}: SmokeDirectOrGroundedReplyArgs) {
  const normalized = normalizeSmokePrompt(content);
  const quickHelloReply = buildSmokeQuickHelloReply({
    normalizedContent: normalized,
    replyLanguage,
    modelProfileName
  });
  if (quickHelloReply) {
    return quickHelloReply;
  }

  const introReply = buildSmokeIntroReply({
    content,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (introReply) {
    return introReply;
  }

  const factReply = buildSmokeFactReply({
    content,
    replyLanguage,
    normalizedContent: normalized,
    recalledMemories,
    addressStyleMemory
  });

  if (factReply) {
    return factReply;
  }

  const groundedReply = buildSmokeGroundedReply({
    content,
    answerStrategy,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    recalledMemories
  });

  if (groundedReply) {
    return groundedReply;
  }

  return null;
}
