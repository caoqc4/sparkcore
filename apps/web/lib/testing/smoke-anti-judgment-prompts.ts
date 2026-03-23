import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
export {
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt
} from "@/lib/testing/smoke-anti-labeling-prompts";
export {
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt
} from "@/lib/testing/smoke-anti-interpretation-prompts";

export function isSmokeAntiLecturingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别教育我") ||
    normalized.includes("别给我上课") ||
    normalized.includes("别跟我说教")
  );
}

export function isSmokeAntiCorrectionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着纠正我") ||
    normalized.includes("别老纠正我")
  );
}
