import { buildSmokeZhBoundaryCareReply } from "@/lib/testing/smoke-zh-boundary-care-replies";
import { buildSmokeZhBoundaryPerspectiveReply } from "@/lib/testing/smoke-zh-boundary-perspective-replies";
import type { SmokeZhBoundaryReplyInput } from "@/lib/testing/smoke-zh-boundary-variant-reply";

export function buildSmokeZhBoundarySoothingReply(args: SmokeZhBoundaryReplyInput) {
  return (
    buildSmokeZhBoundaryCareReply(args) ??
    buildSmokeZhBoundaryPerspectiveReply(args)
  );
}
