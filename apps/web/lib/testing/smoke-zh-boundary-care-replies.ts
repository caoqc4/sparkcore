import {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";

export function buildSmokeZhBoundaryCareReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  if (isSmokeAntiComfortingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别给我打气")) {
      return args.userName
        ? `${args.userName}，好，我先不给你打气，就在这儿陪着你。`
        : "好，我先不给你打气，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着安慰你，就在这儿陪着你。`
      : "好，我先不急着安慰你，就在这儿陪着你。";
  }

  if (isSmokeAntiAdviceFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别上来就给我建议")) {
      return args.userName
        ? `${args.userName}，好，我先不上来就给你建议，就在这儿陪着你。`
        : "好，我先不上来就给你建议，就在这儿陪着你。";
    }

    return args.userName
      ? `${args.userName}，好，我先不急着给你建议，就在这儿陪着你。`
      : "好，我先不急着给你建议，就在这儿陪着你。";
  }

  return null;
}
