import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeLightSharedPushPrompt,
  isSmokeOneLineSoftCatchPrompt,
} from "@/lib/testing/smoke-follow-up-prompts";
import { isSmokeLightStyleSofteningPrompt } from "@/lib/testing/smoke-continuation-prompts";
import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-relationship-detection";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
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
  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `Certainly, ${args.userName}. I will continue in a more formal way.`
      : "Certainly. I will continue in a more formal way.";
  }

  if (args.addressStyleValue === "friendly") {
    return args.userName
      ? `Sure, ${args.userName}. Let's keep chatting.`
      : "Sure, let's keep chatting.";
  }

  if (args.addressStyleValue === "casual") {
    return args.userName
      ? isSmokeLightStyleSofteningPrompt(args.content)
        ? `Sure, ${args.userName}. I can keep it lighter while we continue.`
        : `Sure, ${args.userName}. We can keep going.`
      : isSmokeLightStyleSofteningPrompt(args.content)
        ? "Sure, I can keep it lighter while we continue."
        : "Sure, we can keep going.";
  }

  if (args.recentAssistantReply?.replyLanguage === "en") {
    return args.userName
      ? `Sure, ${args.userName}. We can keep going.`
      : "Sure, we can keep going.";
  }

  return "Thanks, I noted that and I am ready to help with the next step.";
}
