import { buildSmokeDirectFactOrGroundedReply } from "@/lib/testing/smoke-direct-fact-grounded-replies";
import { buildSmokeDirectIntroReply } from "@/lib/testing/smoke-direct-intro-replies";
import type { SmokeDirectOrGroundedReplyArgs } from "@/lib/testing/smoke-direct-reply-types";

export function buildSmokeDirectOrGroundedReply(args: SmokeDirectOrGroundedReplyArgs) {
  const introReply = buildSmokeDirectIntroReply(args);
  if (introReply) {
    return introReply;
  }

  return buildSmokeDirectFactOrGroundedReply(args);
}
