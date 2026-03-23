import { buildSmokeRelationshipSupportiveCoreReply } from "@/lib/testing/smoke-relationship-core-replies";
import { buildSmokeRelationshipSoftCatchReply } from "@/lib/testing/smoke-relationship-soft-catch";
import type { SmokeRelationshipReplyArgs } from "@/lib/testing/smoke-relationship-reply-types";

export function buildSmokeRelationshipSupportiveReply(
  args: SmokeRelationshipReplyArgs
) {
  const softCatchReply = buildSmokeRelationshipSoftCatchReply({
    content: args.content,
    replyLanguage: args.replyLanguage,
    userName: args.userName
  });
  if (softCatchReply) {
    return softCatchReply;
  }

  return buildSmokeRelationshipSupportiveCoreReply(args);
}
