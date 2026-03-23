import { buildSmokeZhBoundaryPressureReply } from "@/lib/testing/smoke-zh-boundary-pressure-replies";
import { buildSmokeZhBoundarySoothingReply } from "@/lib/testing/smoke-zh-boundary-soothing-replies";

export function buildSmokeZhBoundarySupportReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  return (
    buildSmokeZhBoundaryPressureReply(args) ??
    buildSmokeZhBoundarySoothingReply(args)
  );
}
