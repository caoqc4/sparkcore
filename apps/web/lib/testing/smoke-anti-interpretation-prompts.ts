import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeAntiMischaracterizationFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别把我说成那样") ||
    normalized.includes("别把我想成那样")
  );
}

export function isSmokeAntiOverreadingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别替我解读") || normalized.includes("别脑补我");
}

export function isSmokeAntiAnalysisFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着分析我") ||
    normalized.includes("别上来就分析我")
  );
}
