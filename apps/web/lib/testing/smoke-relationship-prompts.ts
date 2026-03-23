import { isSmokeSelfIntroGreetingRequest } from "@/lib/testing/smoke-greeting-prompts";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import {
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt
} from "@/lib/testing/smoke-relationship-explanatory-prompts";
import { isSmokeRelationshipSupportivePrompt } from "@/lib/testing/smoke-relationship-supportive-prompts";

export {
  isSmokeBriefGreetingRequest,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-greeting-prompts";
export {
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt
} from "@/lib/testing/smoke-relationship-explanatory-prompts";
export { isSmokeRelationshipSupportivePrompt } from "@/lib/testing/smoke-relationship-supportive-prompts";

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
