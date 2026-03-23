import {
  buildSmokeRoleCorePacket,
  type SmokeReplyLanguage,
  type SmokeReplyLanguageSource
} from "@/lib/testing/smoke-assistant-builders";
import { detectSmokeReplyLanguage } from "@/lib/testing/smoke-reply-analysis";

export function buildSmokeAssistantTurnMetadata(args: {
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  sameThreadContinuationPreferred: boolean;
  assistantContent: string;
}) {
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
