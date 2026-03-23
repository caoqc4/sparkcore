import {
  isSmokeAntiComparingFollowUpPrompt,
  isSmokeAntiMinimizingFollowUpPrompt,
  isSmokeAntiNormalizingFollowUpPrompt,
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeSameSideFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeZhBoundaryReplyFromRules,
  type SmokeZhBoundaryReplyInput,
  type SmokeZhBoundaryReplyRule
} from "@/lib/testing/smoke-zh-boundary-variant-reply";

const SMOKE_ZH_BOUNDARY_PERSPECTIVE_RULES: SmokeZhBoundaryReplyRule[] = [
  {
    matches: isSmokeAntiMinimizingFollowUpPrompt,
    defaultReply: "好，我先不跟你说这没什么，就在这儿陪着你。",
    variants: [
      {
        fragment: "别跟我说没什么大不了",
        reply: "好，我先不跟你说没什么大不了，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiNormalizingFollowUpPrompt,
    defaultReply: "好，我先不跟你说大家都这样，就在这儿陪着你。",
    variants: [
      {
        fragment: "别跟我说谁都会这样",
        reply: "好，我先不跟你说谁都会这样，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeAntiComparingFollowUpPrompt,
    defaultReply: "好，我先不拿别人跟你比，就在这儿陪着你。",
    variants: [
      {
        fragment: "别老拿别人跟我比",
        reply: "好，我先不老拿别人跟你比，就在这儿陪着你。"
      }
    ]
  },
  {
    matches: isSmokeCompanionStyleExplanationCarryoverPrompt,
    defaultReply: "好，我先顺着你刚刚那点陪你理一下，不岔开。"
  },
  {
    matches: isSmokeSameSideFollowUpPrompt,
    defaultReply: "好，我先站你这边陪着你。",
    variants: [
      {
        fragment: "别跟我讲道理",
        reply: "好，我先站你这边陪着你，不跟你讲道理。"
      }
    ]
  }
];

export function buildSmokeZhBoundaryPerspectiveReply(
  args: SmokeZhBoundaryReplyInput
) {
  return buildSmokeZhBoundaryReplyFromRules(
    args,
    SMOKE_ZH_BOUNDARY_PERSPECTIVE_RULES
  );
}
