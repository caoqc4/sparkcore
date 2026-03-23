import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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

export function isSmokeBriefGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单和我打个招呼") ||
    normalized.includes("简单和我打个招呼") ||
    normalized.includes("简短和我打个招呼") ||
    normalized.includes("greet me briefly") ||
    normalized.includes("say a quick hello")
  );
}

export function isSmokeSelfIntroGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单介绍一下你自己") ||
    normalized.includes("简单介绍一下你自己") ||
    normalized.includes("先简单介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己吧") ||
    normalized.includes("你先介绍下你自己吧") ||
    normalized.includes("先和我介绍一下你自己") ||
    normalized.includes("简单说说你自己") ||
    normalized.includes("introduce yourself briefly") ||
    normalized.includes("briefly introduce yourself") ||
    normalized.includes("introduce yourself first") ||
    normalized.includes("tell me who you are first")
  );
}

export function isSmokeRelationshipExplanatoryPrompt(content: string) {
  return (
    isSmokeRelationshipHelpNextPrompt(content) ||
    isSmokeRelationshipRoughDayPrompt(content)
  );
}

export function isSmokeRelationshipHelpNextPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("接下来你会怎么帮助我") ||
    normalized.includes("接下来你会怎么帮我继续") ||
    normalized.includes("接下来你会怎么陪我继续") ||
    normalized.includes("你会怎么帮助我") ||
    normalized.includes("那你会怎么帮我继续") ||
    normalized.includes("你会怎么帮我往前推进") ||
    normalized.includes("你会怎么陪我往前走") ||
    normalized.includes("how would you help me continue") ||
    normalized.includes("how would you help me next") ||
    normalized.includes("what will you do next to help me")
  );
}

export function isSmokeRelationshipRoughDayPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("如果我今天状态不太好") ||
    normalized.includes("你会怎么和我说") ||
    normalized.includes("你会怎么解释") ||
    normalized.includes("你会怎么安慰我") ||
    normalized.includes("how would you explain that") ||
    normalized.includes("how would you say that to me") ||
    normalized.includes("if i was having a rough day")
  );
}

export function isSmokeRelationshipSupportivePrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("鼓励我一句") ||
    normalized.includes("安慰我一句") ||
    normalized.includes("安慰我一下") ||
    normalized.includes("轻轻接我一下") ||
    normalized.includes("接住我一下") ||
    normalized.includes("陪陪我") ||
    normalized.includes("支持我一下") ||
    normalized.includes("给我一点鼓励") ||
    normalized.includes("如果我有点慌") ||
    normalized.includes("如果我有点没底") ||
    normalized.includes("give me a little encouragement") ||
    normalized.includes("encourage me a bit") ||
    normalized.includes("comfort me a little") ||
    normalized.includes("if i feel a bit overwhelmed") ||
    normalized.includes("if i am feeling unsure")
  );
}

export function isSmokeRelationshipClosingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}

export function isSmokeRelationshipAnswerShapePrompt(content: string) {
  return (
    isSmokeSelfIntroGreetingRequest(content) ||
    isSmokeRelationshipSupportivePrompt(content) ||
    isSmokeRelationshipExplanatoryPrompt(content) ||
    isSmokeRelationshipClosingPrompt(content)
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
