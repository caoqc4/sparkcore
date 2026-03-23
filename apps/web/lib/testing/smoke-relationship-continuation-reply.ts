import { buildSmokeDefaultContinuationReply as buildSmokeDefaultContinuationReplyByLanguage } from "@/lib/testing/smoke-default-continuation-reply";
import type { SmokeContinuationReplyArgs } from "@/lib/testing/smoke-relationship-reply-types";

export function buildSmokeRelationshipContinuationReply(
  args: SmokeContinuationReplyArgs
) {
  return buildSmokeDefaultContinuationReplyByLanguage(args);
}
