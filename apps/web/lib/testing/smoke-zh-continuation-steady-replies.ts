import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeOneLineSoftCatchPrompt,
} from "@/lib/testing/smoke-follow-up-prompts";
import { buildSmokeZhSoftCatchReply } from "@/lib/testing/smoke-soft-catch-replies";
import {
  buildSmokeZhBriefSteadyingReply,
  buildSmokeZhCarryForwardReply,
  buildSmokeZhGuidedNextStepReply,
  buildSmokeZhSharedPushReply,
} from "@/lib/testing/smoke-zh-soft-steady-replies";

export function buildSmokeZhSteadyContinuationReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  if (isSmokeOneLineSoftCatchPrompt(args.content)) {
    return buildSmokeZhSoftCatchReply(args.userName);
  }

  if (isSmokeBriefSteadyingPrompt(args.content)) {
    return buildSmokeZhBriefSteadyingReply(args.userName);
  }

  if (isSmokeGuidedNextStepAfterSteadyingPrompt(args.content)) {
    return buildSmokeZhGuidedNextStepReply(args.userName);
  }

  if (isSmokeGentleCarryForwardAfterSteadyingPrompt(args.content)) {
    return buildSmokeZhCarryForwardReply(args.userName);
  }

  if (isSmokeLightSharedPushPrompt(args.content)) {
    return buildSmokeZhSharedPushReply({
      userName: args.userName,
      isImmediatePush: args.normalized.includes("陪我把眼前这一下弄过去")
    });
  }

  return null;
}
