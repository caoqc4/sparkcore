import {
  isSmokeAntiProbingFollowUpPrompt,
  isSmokeAntiRedirectionFollowUpPrompt,
  isSmokeAntiRushingFollowUpPrompt,
  isSmokeAntiSolutioningFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import { buildSmokeZhBoundaryVariantReply } from "@/lib/testing/smoke-zh-boundary-variant-reply";
import type { SmokeZhBoundaryReplyInput } from "@/lib/testing/smoke-zh-boundary-reply-types";

export function buildSmokeZhBoundaryPressureReply(
  args: SmokeZhBoundaryReplyInput
) {
  if (isSmokeAntiProbingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不问你为什么，就在这儿陪着你。",
      variants: [
        {
          fragment: "别盘问我",
          reply: "好，我先不盘问你，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiRushingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不催你，就在这儿陪着你。",
      variants: [
        {
          fragment: "别逼我",
          reply: "好，我先不逼你，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiSolutioningFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着帮你解决，就在这儿陪着你。",
      variants: [
        {
          fragment: "别上来就帮我解决",
          reply: "好，我先不上来就帮你解决，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiRedirectionFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不转移话题，就在这儿陪着你。",
      variants: [
        {
          fragment: "别岔开话题",
          reply: "好，我先不岔开话题，就在这儿陪着你。"
        }
      ]
    });
  }

  return null;
}
