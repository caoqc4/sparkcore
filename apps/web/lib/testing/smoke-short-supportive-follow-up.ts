import { matchesSmokeShortSupportivePredicate } from "@/lib/testing/smoke-short-supportive-predicate-groups";

export function isSmokeShortRelationshipSupportivePrompt(content: string) {
  return matchesSmokeShortSupportivePredicate(content);
}
