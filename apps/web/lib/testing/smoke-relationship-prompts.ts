import { isSmokeSelfIntroGreetingRequest } from "@/lib/testing/smoke-greeting-prompts";
import {
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipHelpNextPrompt,
  isSmokeRelationshipRoughDayPrompt
} from "@/lib/testing/smoke-relationship-explanatory-prompts";
import { isSmokeRelationshipSupportivePrompt } from "@/lib/testing/smoke-relationship-supportive-prompts";
import { isSmokeRelationshipClosingPrompt } from "@/lib/testing/smoke-relationship-closing-prompts";

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
export { isSmokeRelationshipClosingPrompt } from "@/lib/testing/smoke-relationship-closing-prompts";

export function isSmokeRelationshipAnswerShapePrompt(content: string) {
  return (
    isSmokeSelfIntroGreetingRequest(content) ||
    isSmokeRelationshipSupportivePrompt(content) ||
    isSmokeRelationshipExplanatoryPrompt(content) ||
    isSmokeRelationshipClosingPrompt(content)
  );
}
