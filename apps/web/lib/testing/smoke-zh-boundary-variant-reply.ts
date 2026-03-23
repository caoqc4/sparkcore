import { withSmokeZhBoundaryUserPrefix } from "@/lib/testing/smoke-zh-boundary-reply-prefix";

export function buildSmokeZhBoundaryVariantReply(args: {
  userName: string | null;
  normalized: string;
  defaultReply: string;
  variants?: Array<{
    fragment: string;
    reply: string;
  }>;
}) {
  const matchedReply =
    args.variants?.find((variant) => args.normalized.includes(variant.fragment))
      ?.reply ?? args.defaultReply;

  return withSmokeZhBoundaryUserPrefix(args.userName, matchedReply);
}
