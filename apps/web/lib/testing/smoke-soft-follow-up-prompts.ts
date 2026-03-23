import {
  hasAllSmokePromptFragments,
  hasAnySmokePromptFragment
} from "@/lib/testing/smoke-prompt-matchers";

export function isSmokeOneLineSoftCatchPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["回我一句就好"]);
}

export function isSmokeBriefSteadyingPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["缓一下", "再说"]);
}

export function isSmokeGentleCarryForwardAfterSteadyingPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["缓一下", "再陪我往下走一点"]);
}

export function isSmokeGuidedNextStepAfterSteadyingPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["陪我理一步"]);
}

export function isSmokeLightSharedPushPrompt(content: string) {
  return hasAnySmokePromptFragment(content, [
    "一起把这一点弄过去",
    "陪我把眼前这一下弄过去"
  ]);
}

export function isSmokeFriendLikeSoftFollowUpPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["继续陪我说一句"]);
}

export function isSmokeStayWithMeFollowUpPrompt(content: string) {
  return hasAllSmokePromptFragments(content, ["继续陪着我说就行"]);
}

export function isSmokeGentleResumeRhythmPrompt(content: string) {
  return hasAnySmokePromptFragment(content, [
    "慢慢继续和我说",
    "顺着刚才那样继续说"
  ]);
}

export function isSmokePresenceConfirmingFollowUpPrompt(content: string) {
  return hasAnySmokePromptFragment(content, [
    "还在这儿陪我",
    "先别走开"
  ]);
}
