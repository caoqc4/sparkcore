import {
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeZhBoundaryReplyFromRules,
  type SmokeZhBoundaryReplyInput,
  type SmokeZhBoundaryReplyRule
} from "@/lib/testing/smoke-zh-boundary-variant-reply";

const SMOKE_ZH_BOUNDARY_INTERPRETATION_RULES: SmokeZhBoundaryReplyRule[] = [
  {
    matches: isSmokeAntiLabelingFollowUpPrompt,
    defaultReply: "好，我先不急着给你定性，就在这儿陪着你。"
  },
  {
    matches: isSmokeAntiTaggingFollowUpPrompt,
    defaultReply: "好，我先不急着给你贴标签，就在这儿陪着你。"
  },
  {
    matches: isSmokeAntiMischaracterizationFollowUpPrompt,
    defaultReply: "好，我先不急着把你说成那样，就在这儿陪着你。",
    variants: [
      {
        fragment: "别把我想成那样",
        reply: "好，我先不急着把你想成那样，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiOverreadingFollowUpPrompt,
    defaultReply: "好，我先不急着替你解读，就在这儿陪着你。",
    variants: [
      {
        fragment: "别脑补我",
        reply: "好，我先不急着脑补你，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiAnalysisFollowUpPrompt,
    defaultReply: "好，我先不急着分析你，就在这儿陪着你。"
  },
  {
    matches: isSmokeAntiDefinitionFollowUpPrompt,
    defaultReply: "好，我先不替你定义，就在这儿陪着你。"
  },
  {
    matches: isSmokeAntiCategorizingFollowUpPrompt,
    defaultReply: "好，我先不替你归类，就在这儿陪着你。"
  }
];

export function buildSmokeZhBoundaryInterpretationReply(
  args: SmokeZhBoundaryReplyInput
) {
  return buildSmokeZhBoundaryReplyFromRules(
    args,
    SMOKE_ZH_BOUNDARY_INTERPRETATION_RULES
  );
}
