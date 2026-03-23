import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
export {
  isSmokeBriefGreetingRequest,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt,
  isSmokeRelationshipSupportivePrompt,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-relationship-prompts";

export function isSmokeDirectNamingQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("你叫什么") ||
    normalized.includes("我以后怎么叫你") ||
    normalized.includes("你不是叫") ||
    normalized.includes("what should i call you") ||
    normalized.includes("what do i call you") ||
    normalized.includes("what is your name") ||
    normalized.includes("aren't you called")
  );
}

export function isSmokeDirectUserPreferredNameQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("你该怎么叫我") ||
    normalized.includes("你以后怎么叫我") ||
    normalized.includes("你接下来会怎么叫我") ||
    normalized.includes("你会怎么叫我") ||
    normalized.includes("你接下来会怎么称呼我") ||
    normalized.includes("你会怎么称呼我") ||
    normalized.includes("你应该叫我什么") ||
    normalized.includes("你叫我什么") ||
    normalized.includes("what should you call me") ||
    normalized.includes("what do you call me") ||
    normalized.includes("how should you address me")
  );
}

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

export function isSmokeOpenEndedPlanningHelpQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("how should we plan my week") ||
    normalized.includes("how should you help me plan my week") ||
    normalized.includes("given what you know about me") ||
    normalized.includes("结合你记得的内容，怎么帮我规划这周") ||
    normalized.includes("结合你对我的了解") ||
    normalized.includes("你会怎么帮我规划这周") ||
    normalized.includes("给我一个小建议") ||
    normalized.includes("带我往下走吧") ||
    normalized.includes("陪我理一步") ||
    normalized.includes("陪我理一下") ||
    normalized.includes("陪我顺一下")
  );
}

export function isSmokeOpenEndedSummaryQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("summarize what you know about me") ||
    normalized.includes("briefly summarize what you remember") ||
    normalized.includes("简单总结一下你记得的内容") ||
    normalized.includes("简单总结一下你对我的了解")
  );
}
