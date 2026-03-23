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
