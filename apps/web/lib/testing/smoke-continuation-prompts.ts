import {
  isSmokeBriefSteadyingPrompt,
  isSmokeGentleCarryForwardAfterSteadyingPrompt,
  isSmokeGuidedNextStepAfterSteadyingPrompt,
  isSmokeOneLineSoftCatchPrompt,
  isSmokeShortRelationshipSupportivePrompt
} from "@/lib/testing/smoke-follow-up-prompts";
import {
  isSmokeCompanionStyleExplanationCarryoverPrompt as isSmokeCompanionStyleExplanationCarryoverPromptByPrompt,
  isSmokeShortRelationshipSummaryFollowUpPrompt as isSmokeShortRelationshipSummaryFollowUpPromptByPrompt
} from "@/lib/testing/smoke-continuation-carryover-prompts";
import { isSmokeFuzzyFollowUpQuestion as isSmokeFuzzyFollowUpQuestionByPrompt } from "@/lib/testing/smoke-fuzzy-follow-up-prompts";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { isSmokeRelationshipContinuationEdgePrompt as isSmokeRelationshipContinuationEdgePromptByPrompt } from "@/lib/testing/smoke-relationship-continuation-prompts";

export function isSmokeLightStyleSofteningPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    (normalized.includes("别太正式") &&
      (normalized.includes("轻一点和我说") || normalized.includes("轻一点和我讲"))) ||
    normalized.includes("轻松点和我说就好") ||
    normalized.includes("轻松点和我讲就好")
  );
}

export function isSmokeShortRelationshipSummaryFollowUpPrompt(content: string) {
  return isSmokeShortRelationshipSummaryFollowUpPromptByPrompt(content);
}

export function isSmokeCompanionStyleExplanationCarryoverPrompt(content: string) {
  return isSmokeCompanionStyleExplanationCarryoverPromptByPrompt(content);
}

export function isSmokeFuzzyFollowUpQuestion(content: string) {
  return isSmokeFuzzyFollowUpQuestionByPrompt(content);
}

export function isSmokeRelationshipContinuationEdgePrompt(content: string) {
  return isSmokeRelationshipContinuationEdgePromptByPrompt(content);
}
