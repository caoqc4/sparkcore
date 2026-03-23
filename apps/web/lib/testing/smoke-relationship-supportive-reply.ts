import { buildSmokeRelationshipSupportiveCoreReply } from "@/lib/testing/smoke-relationship-supportive-core";
import { isSmokeOneLineSoftCatchPrompt } from "@/lib/testing/smoke-follow-up-prompts";
import {
  buildSmokeEnSoftCatchReply,
  buildSmokeZhSoftCatchReply
} from "@/lib/testing/smoke-soft-catch-replies";
import type { SmokeRelationshipReplyArgs } from "@/lib/testing/smoke-relationship-reply-types";

export function buildSmokeRelationshipSupportiveReply(
  args: SmokeRelationshipReplyArgs
) {
  if (isSmokeOneLineSoftCatchPrompt(args.content)) {
    return args.replyLanguage === "zh-Hans"
      ? buildSmokeZhSoftCatchReply(args.userName)
      : buildSmokeEnSoftCatchReply(args.userName);
  }

  return buildSmokeRelationshipSupportiveCoreReply(args);
}
