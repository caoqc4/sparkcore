export type SmokeZhBoundaryReplyInput = {
  content: string;
  normalized: string;
  userName: string | null;
};

export type SmokeZhBoundaryVariant = {
  fragment: string;
  reply: string;
};

export type SmokeZhBoundaryReplyRule = {
  matches: (content: string) => boolean;
  defaultReply: string;
  variants?: SmokeZhBoundaryVariant[];
};

function withSmokeZhBoundaryUserPrefix(
  userName: string | null,
  content: string
) {
  return userName ? `${userName}，${content}` : content;
}

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

export function buildSmokeZhBoundaryReplyFromRules(
  input: SmokeZhBoundaryReplyInput,
  rules: SmokeZhBoundaryReplyRule[]
) {
  const matchedRule = rules.find((rule) => rule.matches(input.content));
  if (!matchedRule) {
    return null;
  }

  return buildSmokeZhBoundaryVariantReply({
    userName: input.userName,
    normalized: input.normalized,
    defaultReply: matchedRule.defaultReply,
    variants: matchedRule.variants,
  });
}
