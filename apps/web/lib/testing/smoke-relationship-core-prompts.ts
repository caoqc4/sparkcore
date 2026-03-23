import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import { isSmokeSelfIntroGreetingRequest } from "@/lib/testing/smoke-greeting-prompts";

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
