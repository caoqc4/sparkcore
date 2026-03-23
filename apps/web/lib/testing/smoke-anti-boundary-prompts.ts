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

export function isSmokeAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}
