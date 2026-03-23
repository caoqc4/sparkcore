import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeRelationshipClosingPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("最后你会怎么陪我把事情推进下去") ||
    normalized.includes("最后你会怎么收尾") ||
    normalized.includes("how would you help me close this out") ||
    normalized.includes("how would you wrap this up")
  );
}
