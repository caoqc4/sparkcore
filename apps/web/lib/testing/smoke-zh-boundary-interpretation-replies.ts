import {
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import type { SmokeZhBoundaryReplyInput } from "@/lib/testing/smoke-zh-boundary-reply-types";
import { buildSmokeZhBoundaryVariantReply } from "@/lib/testing/smoke-zh-boundary-variant-reply";

export function buildSmokeZhBoundaryInterpretationReply(
  args: SmokeZhBoundaryReplyInput
) {
  if (isSmokeAntiLabelingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着给你定性，就在这儿陪着你。"
    });
  }

  if (isSmokeAntiTaggingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着给你贴标签，就在这儿陪着你。"
    });
  }

  if (isSmokeAntiMischaracterizationFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着把你说成那样，就在这儿陪着你。",
      variants: [
        {
          fragment: "别把我想成那样",
          reply: "好，我先不急着把你想成那样，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiOverreadingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着替你解读，就在这儿陪着你。",
      variants: [
        {
          fragment: "别脑补我",
          reply: "好，我先不急着脑补你，就在这儿陪着你。"
        }
      ]
    });
  }

  if (isSmokeAntiAnalysisFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不急着分析你，就在这儿陪着你。"
    });
  }

  if (isSmokeAntiDefinitionFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不替你定义，就在这儿陪着你。"
    });
  }

  if (isSmokeAntiCategorizingFollowUpPrompt(args.content)) {
    return buildSmokeZhBoundaryVariantReply({
      userName: args.userName,
      normalized: args.normalized,
      defaultReply: "好，我先不替你归类，就在这儿陪着你。"
    });
  }

  return null;
}
