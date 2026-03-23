import { buildSmokeZhBoundaryCareReply } from "@/lib/testing/smoke-zh-boundary-care-replies";
import { buildSmokeZhBoundaryPerspectiveReply } from "@/lib/testing/smoke-zh-boundary-perspective-replies";

export function buildSmokeZhBoundarySoothingReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  return (
    buildSmokeZhBoundaryCareReply(args) ??
    buildSmokeZhBoundaryPerspectiveReply(args)
  );
}
