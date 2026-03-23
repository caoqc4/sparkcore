import { buildSmokeFactReply } from "@/lib/testing/smoke-fact-replies";
import { buildSmokeGroundedReply } from "@/lib/testing/smoke-grounded-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import type { SmokeDirectOrGroundedReplyArgs } from "@/lib/testing/smoke-direct-reply-types";

export function buildSmokeDirectFactOrGroundedReply(
  args: SmokeDirectOrGroundedReplyArgs
) {
  const normalized = normalizeSmokePrompt(args.content);
  const factReply = buildSmokeFactReply({
    content: args.content,
    replyLanguage: args.replyLanguage,
    normalizedContent: normalized,
    recalledMemories: args.recalledMemories,
    addressStyleMemory: args.addressStyleMemory
  });

  if (factReply) {
    return factReply;
  }

  return buildSmokeGroundedReply({
    content: args.content,
    answerStrategy: args.answerStrategy,
    replyLanguage: args.replyLanguage,
    agentName: args.agentName,
    addressStyleMemory: args.addressStyleMemory,
    nicknameMemory: args.nicknameMemory,
    preferredNameMemory: args.preferredNameMemory,
    recalledMemories: args.recalledMemories
  });
}
