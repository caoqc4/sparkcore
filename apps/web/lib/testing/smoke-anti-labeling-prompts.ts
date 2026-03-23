import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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
