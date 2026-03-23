import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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

export function isSmokeAntiConclusionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我下结论") ||
    normalized.includes("别这么快下结论")
  );
}

export function isSmokeAntiLabelingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我定性") ||
    normalized.includes("别急着给我定性")
  );
}

export function isSmokeAntiTaggingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我贴标签") ||
    normalized.includes("别急着给我贴标签")
  );
}

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

export function isSmokeAntiDefinitionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别替我定义") ||
    normalized.includes("别替我下定义")
  );
}

export function isSmokeAntiCategorizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别替我归类");
}
