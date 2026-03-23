import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeOneLineSoftCatchPrompt,
} from "@/lib/testing/smoke-follow-up-prompts";
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-relationship-detection";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeEnDefaultContinuationReply as buildSmokeEnDefaultContinuationReplyByStyle } from "@/lib/testing/smoke-en-continuation-replies";
import { buildSmokeZhSoftCatchReply } from "@/lib/testing/smoke-soft-catch-replies";
import {
  buildSmokeZhBriefSteadyingReply,
  buildSmokeZhCarryForwardReply,
  buildSmokeZhGuidedNextStepReply,
  buildSmokeZhSharedPushReply
} from "@/lib/testing/smoke-zh-soft-steady-replies";
import { buildSmokeZhBoundaryFollowUpReply } from "@/lib/testing/smoke-zh-boundary-followups";
import { buildSmokeZhContinuationTail } from "@/lib/testing/smoke-zh-continuation-tail";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeZhDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  const normalized = normalizeSmokePrompt(args.content);
  const styleValue =
    args.addressStyleValue ?? detectSmokeUserAddressStyleCandidate(args.content);

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
      isImmediatePush: normalized.includes("陪我把眼前这一下弄过去")
    });
  }

  const boundaryReply = buildSmokeZhBoundaryFollowUpReply({
    content: args.content,
    normalized,
    userName: args.userName
  });
  if (boundaryReply) {
    return boundaryReply;
  }

  return buildSmokeZhContinuationTail({
    content: args.content,
    normalized,
    styleValue,
    userName: args.userName,
    recentAssistantReply: args.recentAssistantReply
  });
}

export function buildSmokeEnDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  return buildSmokeEnDefaultContinuationReplyByStyle(args);
}
