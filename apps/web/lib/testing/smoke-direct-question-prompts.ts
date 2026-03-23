import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
export {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion
} from "@/lib/testing/smoke-direct-naming-prompts";

export function isSmokeDirectPlanningPreferenceQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what planning style do i prefer") ||
    normalized.includes("what kind of planning style do i prefer") ||
    normalized.includes("what kind of weekly planning style would fit me best") ||
    normalized.includes("我喜欢什么样的规划方式") ||
    normalized.includes("我偏好什么样的规划方式")
  );
}

export function isSmokeDirectProfessionQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what profession do you remember") ||
    normalized.includes("what work do you remember") ||
    normalized.includes("what kind of work do i do") ||
    normalized.includes("what do you remember about my work") ||
    normalized.includes("你记得我做什么") ||
    normalized.includes("你记得我的职业") ||
    normalized.includes("你记得我从事什么")
  );
}

export function isSmokeDirectReplyStyleQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("what kind of reply style do i prefer") ||
    normalized.includes("what reply style do i prefer") ||
    normalized.includes("what kind of tone do i prefer") ||
    normalized.includes("我喜欢什么样的回复方式") ||
    normalized.includes("我偏好什么样的回复方式") ||
    normalized.includes("我喜欢什么语气") ||
    normalized.includes("我偏好什么语气")
  );
}
