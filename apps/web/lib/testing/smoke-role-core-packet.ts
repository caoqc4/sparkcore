import { getSmokeRoleCoreRelationshipStance } from "@/lib/testing/smoke-role-core-relationship";
import type { SmokeRoleCorePacketInput } from "@/lib/testing/smoke-role-core-packet-types";

export type SmokeReplyLanguage = "zh-Hans" | "en" | "unknown";
export type SmokeReplyLanguageSource =
  | "latest-user-message"
  | "thread-continuity-fallback"
  | "no-latest-user-message";

export type SmokeRoleCoreRelationshipStance =
  | "default-agent-profile"
  | "formal"
  | "friendly"
  | "casual"
  | "no_full_name";

export type SmokeRoleCorePacket = {
  packet_version: "v1";
  identity: {
    agent_id: string;
    agent_name: string;
  };
  persona_summary: string | null;
  style_guidance: string | null;
  relationship_stance: {
    effective: SmokeRoleCoreRelationshipStance;
    source: "agent_profile_default" | "relationship_memory";
  };
  language_behavior: {
    reply_language_target: SmokeReplyLanguage;
    reply_language_source: SmokeReplyLanguageSource;
    same_thread_continuation_preferred: boolean;
  };
};

export function buildSmokeRoleCorePacket(
  args: SmokeRoleCorePacketInput
): SmokeRoleCorePacket {
  return {
    packet_version: "v1",
    identity: {
      agent_id: args.agentId,
      agent_name: args.agentName
    },
    persona_summary: args.personaSummary,
    style_guidance: args.styleGuidance,
    relationship_stance: getSmokeRoleCoreRelationshipStance(
      args.relationshipStyleValue
    ),
    language_behavior: {
      reply_language_target: args.replyLanguage,
      reply_language_source: args.replyLanguageSource,
      same_thread_continuation_preferred: args.preferSameThreadContinuation
    }
  };
}
