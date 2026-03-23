import { SMOKE_SHORT_SUPPORTIVE_PREDICATES } from "@/lib/testing/smoke-short-supportive-predicates";

export function isSmokeShortRelationshipSupportivePrompt(content: string) {
  return SMOKE_SHORT_SUPPORTIVE_PREDICATES.some((predicate) => predicate(content));
}
