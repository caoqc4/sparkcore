import {
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeNonJudgingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import type {
  SmokeZhBoundaryReplyInput,
  SmokeZhBoundaryReplyRule,
} from "@/lib/testing/smoke-zh-boundary-reply-types";
import { buildSmokeZhBoundaryReplyFromRules } from "@/lib/testing/smoke-zh-boundary-variant-reply";

const SMOKE_ZH_BOUNDARY_JUDGMENT_RULES: SmokeZhBoundaryReplyRule[] = [
  {
    matches: isSmokeNonJudgingFollowUpPrompt,
    defaultReply: "好，我先不评判你，就在这儿陪着你。",
    variants: [
      {
        fragment: "别数落我",
        reply: "好，我先不数落你，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiLecturingFollowUpPrompt,
    defaultReply: "好，我先不教育你，就在这儿陪着你。",
    variants: [
      {
        fragment: "别给我上课",
        reply: "好，我先不给你上课，就在这儿陪着你。"
      },
      {
        fragment: "别跟我说教",
        reply: "好，我先不跟你说教，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiCorrectionFollowUpPrompt,
    defaultReply: "好，我先不急着纠正你，就在这儿陪着你。",
    variants: [
      {
        fragment: "别老纠正我",
        reply: "好，我先不老纠正你，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiConclusionFollowUpPrompt,
    defaultReply: "好，我先不急着给你下结论，就在这儿陪着你。",
    variants: [
      {
        fragment: "别这么快下结论",
        reply: "好，我先不这么快给你下结论，就在这儿陪着你。"
      }
    ]
  }
];

export function buildSmokeZhBoundaryJudgmentReply(
  args: SmokeZhBoundaryReplyInput
) {
  return buildSmokeZhBoundaryReplyFromRules(args, SMOKE_ZH_BOUNDARY_JUDGMENT_RULES);
}
