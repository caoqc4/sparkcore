import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeOneLineSoftCatchPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("回我一句就好");
}

export function isSmokeBriefSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("缓一下") && normalized.includes("再说");
}

export function isSmokeGentleCarryForwardAfterSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("缓一下") &&
    normalized.includes("再陪我往下走一点")
  );
}

export function isSmokeGuidedNextStepAfterSteadyingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("陪我理一步");
}

export function isSmokeLightSharedPushPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("一起把这一点弄过去") ||
    normalized.includes("陪我把眼前这一下弄过去")
  );
}

export function isSmokeFriendLikeSoftFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("继续陪我说一句");
}

export function isSmokeStayWithMeFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("继续陪着我说就行");
}

export function isSmokeGentleResumeRhythmPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("慢慢继续和我说") ||
    normalized.includes("顺着刚才那样继续说")
  );
}

export function isSmokePresenceConfirmingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("还在这儿陪我") ||
    normalized.includes("先别走开")
  );
}
