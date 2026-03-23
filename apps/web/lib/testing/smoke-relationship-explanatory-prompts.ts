import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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

export function isSmokeRelationshipExplanatoryPrompt(content: string) {
  return (
    isSmokeRelationshipHelpNextPrompt(content) ||
    isSmokeRelationshipRoughDayPrompt(content)
  );
}
