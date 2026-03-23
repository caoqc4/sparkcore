import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeAntiComfortingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着安慰我") ||
    normalized.includes("别给我打气")
  );
}

export function isSmokeAntiAdviceFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着给我建议") ||
    normalized.includes("别上来就给我建议")
  );
}

export function isSmokeAntiMinimizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别跟我说这没什么") ||
    normalized.includes("别跟我说没什么大不了")
  );
}

export function isSmokeAntiNormalizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别跟我说大家都这样") ||
    normalized.includes("别跟我说谁都会这样")
  );
}

export function isSmokeAntiComparingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别拿别人跟我比") ||
    normalized.includes("别老拿别人跟我比")
  );
}
