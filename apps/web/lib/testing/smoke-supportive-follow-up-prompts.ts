import {
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt
} from "@/lib/testing/smoke-supportive-follow-up-literals";
import { isSmokeShortRelationshipSupportivePrompt as isSmokeShortRelationshipSupportivePromptByHelper } from "@/lib/testing/smoke-short-supportive-follow-up";
export {
  isSmokeNonJudgingFollowUpPrompt,
  isSmokeSameSideFollowUpPrompt
} from "@/lib/testing/smoke-supportive-follow-up-literals";

export function isSmokeShortRelationshipSupportivePrompt(content: string) {
  return isSmokeShortRelationshipSupportivePromptByHelper(content);
}
