import type { SmokeContinuationReasonCode } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeFuzzyFollowUpQuestion,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-prompts";
import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeShortRelationshipSupportivePrompt
} from "@/lib/testing/smoke-follow-up-prompts";

export function getSmokeContinuationReasonCode(
  content: string
): SmokeContinuationReasonCode | null {
  if (
    isSmokeShortRelationshipSupportivePrompt(content) ||
    isSmokeCompanionStyleExplanationCarryoverPrompt(content) ||
    isSmokeBriefSteadyingPrompt(content) ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeGuidedNextStepAfterSteadyingPrompt(content)
  ) {
    return "brief-supportive-carryover";
  }

  if (isSmokeShortRelationshipSummaryFollowUpPrompt(content)) {
    return "brief-summary-carryover";
  }

  if (isSmokeFuzzyFollowUpQuestion(content)) {
    return "short-fuzzy-follow-up";
  }

  return null;
}
