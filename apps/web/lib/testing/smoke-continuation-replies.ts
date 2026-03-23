import { detectSmokeUserAddressStyleCandidate } from "@/lib/testing/smoke-address-style-detection";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { buildSmokeEnDefaultContinuationReply as buildSmokeEnDefaultContinuationReplyByStyle } from "@/lib/testing/smoke-en-continuation-replies";
import { buildSmokeZhSteadyContinuationReply } from "@/lib/testing/smoke-zh-continuation-steady-replies";
import { buildSmokeZhBoundaryFollowUpReply } from "@/lib/testing/smoke-zh-boundary-followups";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";
import { buildSmokeZhContinuationPromptReply } from "@/lib/testing/smoke-zh-continuation-prompt-replies";
import { buildSmokeZhContinuationStyleReply } from "@/lib/testing/smoke-zh-continuation-style-replies";

function buildSmokeZhContinuationTail(args: {
  content: string;
  normalized: string;
  styleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  return (
    buildSmokeZhContinuationPromptReply(args) ??
    buildSmokeZhContinuationStyleReply(args)
  );
}

export function buildSmokeZhDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  const normalized = normalizeSmokePrompt(args.content);
  const styleValue =
    args.addressStyleValue ?? detectSmokeUserAddressStyleCandidate(args.content);

  const steadyReply = buildSmokeZhSteadyContinuationReply({
    content: args.content,
    normalized,
    userName: args.userName
  });
  if (steadyReply) {
    return steadyReply;
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
