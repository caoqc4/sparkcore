import { buildSmokeZhBoundaryPressureReply } from "@/lib/testing/smoke-zh-boundary-pressure-replies";
import { buildSmokeZhBoundarySoothingReply } from "@/lib/testing/smoke-zh-boundary-soothing-replies";
import type { SmokeZhBoundaryReplyInput } from "@/lib/testing/smoke-zh-boundary-variant-reply";

export function buildSmokeZhBoundarySupportReply(args: SmokeZhBoundaryReplyInput) {
  return (
    buildSmokeZhBoundaryPressureReply(args) ??
    buildSmokeZhBoundarySoothingReply(args)
  );
}
