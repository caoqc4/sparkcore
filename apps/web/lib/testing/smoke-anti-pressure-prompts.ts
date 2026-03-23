import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeAntiProbingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别问我为什么") ||
    normalized.includes("别追着问我") ||
    normalized.includes("别盘问我")
  );
}

export function isSmokeAntiRushingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别催我") || normalized.includes("别逼我");
}

export function isSmokeAntiSolutioningFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着帮我解决") ||
    normalized.includes("别上来就帮我解决")
  );
}

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

export function isSmokeAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}
