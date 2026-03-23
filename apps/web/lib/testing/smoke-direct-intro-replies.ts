import { buildSmokeIntroReply } from "@/lib/testing/smoke-intro-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeQuickHelloReply } from "@/lib/testing/smoke-quick-hello-replies";
import type { SmokeDirectOrGroundedReplyArgs } from "@/lib/testing/smoke-direct-reply-types";

export function buildSmokeDirectIntroReply(
  args: SmokeDirectOrGroundedReplyArgs
) {
  const normalized = normalizeSmokePrompt(args.content);
  const quickHelloReply = buildSmokeQuickHelloReply({
    normalizedContent: normalized,
    replyLanguage: args.replyLanguage,
    modelProfileName: args.modelProfileName
  });
  if (quickHelloReply) {
    return quickHelloReply;
  }

  return buildSmokeIntroReply({
    content: args.content,
    replyLanguage: args.replyLanguage,
    agentName: args.agentName,
    addressStyleMemory: args.addressStyleMemory,
    nicknameMemory: args.nicknameMemory,
    preferredNameMemory: args.preferredNameMemory
  });
}
