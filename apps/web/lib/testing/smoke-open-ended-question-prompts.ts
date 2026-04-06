import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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

export function isSmokeRoleCapabilityQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  if (
    normalized.includes("接下来") ||
    normalized.includes("下一步") ||
    normalized.includes("继续") ||
    normalized.includes("推进") ||
    normalized.includes("往前") ||
    normalized.includes("rough day")
  ) {
    return false;
  }

  return (
    normalized.includes("你平时会怎么帮我") ||
    normalized.includes("你平时怎么帮我") ||
    normalized.includes("你一般会怎么帮我") ||
    normalized.includes("你通常会怎么帮我") ||
    normalized.includes("你平时会怎么帮助我") ||
    normalized.includes("你一般会怎么帮助我") ||
    normalized.includes("你通常会怎么帮助我") ||
    normalized.includes("平时你会怎么帮我") ||
    normalized.includes("平时你怎么帮我") ||
    normalized.includes("what do you usually help me with") ||
    normalized.includes("how do you usually help me") ||
    normalized.includes("how would you usually help me") ||
    normalized.includes("what kind of help do you usually offer")
  );
}

export function isSmokeRoleBackgroundQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("简单说说你的背景") ||
    normalized.includes("简单讲讲你的背景") ||
    normalized.includes("说说你的背景") ||
    normalized.includes("讲讲你的背景") ||
    normalized.includes("你的背景是什么") ||
    normalized.includes("你是什么背景") ||
    normalized.includes("你是什么来历") ||
    normalized.includes("简单介绍一下你的背景") ||
    normalized.includes("briefly tell me your background") ||
    normalized.includes("tell me your background") ||
    normalized.includes("what is your background")
  );
}

export function isSmokeRoleBoundaryQuestion(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("你能做什么，不能做什么") ||
    normalized.includes("你能做什么和不能做什么") ||
    normalized.includes("你能做什么不能做什么") ||
    normalized.includes("你能做什么") ||
    normalized.includes("你不能做什么") ||
    normalized.includes("你的边界是什么") ||
    normalized.includes("what can you do and what can you not do") ||
    normalized.includes("what can you do") ||
    normalized.includes("what can't you do") ||
    normalized.includes("what are your boundaries")
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
