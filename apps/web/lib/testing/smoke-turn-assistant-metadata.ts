import { buildSmokeRoleCorePacket } from "@/lib/testing/smoke-role-core-packet";
import { detectSmokeReplyLanguage } from "@/lib/testing/smoke-reply-language";
import type { SmokeAssistantTurnMetadataInput } from "@/lib/testing/smoke-turn-assistant-types";

export function buildSmokeAssistantTurnMetadata(
  args: SmokeAssistantTurnMetadataInput
) {
  const roleCorePacket = buildSmokeRoleCorePacket({
    agentId: args.agentId,
    agentName: args.agentName,
    personaSummary: args.personaSummary,
    styleGuidance: args.styleGuidance,
    relationshipStyleValue: args.relationshipStyleValue,
    replyLanguage: args.replyLanguage,
    replyLanguageSource: args.replyLanguageSource,
    preferSameThreadContinuation: args.sameThreadContinuationPreferred
  });

  return {
    roleCorePacket,
    replyLanguageDetected: detectSmokeReplyLanguage(args.assistantContent)
  };
}
