import {
  isSmokeAntiAdviceFollowUpPrompt,
  isSmokeAntiComfortingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeZhBoundaryVariantReply,
  type SmokeZhBoundaryReplyInput
} from "@/lib/testing/smoke-zh-boundary-variant-reply";

export function buildSmokeZhBoundaryCareReply(args: SmokeZhBoundaryReplyInput) {
  if (isSmokeAntiComfortingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着安慰你，就在这儿陪着你。",
      variants: [
        {
          fragment: "别给我打气",
          reply: "好，我先不给你打气，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiAdviceFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着给你建议，就在这儿陪着你。",
      variants: [
        {
          fragment: "别上来就给我建议",
          reply: "好，我先不上来就给你建议，就在这儿陪着你。"
        }
      ]
    });
  }

  return null;
}
