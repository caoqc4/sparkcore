import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokeShortRelationshipSupportivePrompt,
} from "@/lib/testing/smoke-follow-up-prompts";
import {
  isSmokeCompanionStyleExplanationCarryoverPrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt
} from "@/lib/testing/smoke-continuation-carryover-prompts";
import { isSmokeFuzzyFollowUpQuestion } from "@/lib/testing/smoke-fuzzy-follow-up-prompts";

export function isSmokeRelationshipContinuationEdgePrompt(content: string) {
  return (
    isSmokeFuzzyFollowUpQuestion(content) ||
    isSmokeShortRelationshipSupportivePrompt(content) ||
    isSmokeShortRelationshipSummaryFollowUpPrompt(content) ||
    isSmokeCompanionStyleExplanationCarryoverPrompt(content) ||
    isSmokeOneLineSoftCatchPrompt(content) ||
    isSmokeBriefSteadyingPrompt(content) ||
    isSmokeGentleCarryForwardAfterSteadyingPrompt(content) ||
    isSmokeGuidedNextStepAfterSteadyingPrompt(content)
  );
}
