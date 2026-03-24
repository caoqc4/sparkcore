export type RoleProfile = {
  id: string;
  name: string;
  persona_summary: string;
  style_prompt: string;
  system_prompt: string;
  default_model_profile_id: string | null;
  metadata: Record<string, unknown>;
};

export type AgentRecord = RoleProfile;

export type RuntimeReplyLanguage = "zh-Hans" | "en" | "unknown";

export type ReplyLanguageSource =
  | "latest-user-message"
  | "thread-continuity-fallback"
  | "no-latest-user-message";

export type RoleCoreRelationshipStance =
  | "default-agent-profile"
  | "formal"
  | "friendly"
  | "casual"
  | "no_full_name";

export type RoleCorePacket = {
  packet_version: "v1" | "v2";
  identity: {
    agent_id: string;
    agent_name: string;
  };
  persona_summary: string | null;
  style_guidance: string | null;
  relationship_stance: {
    effective: RoleCoreRelationshipStance;
    source: "agent_profile_default" | "relationship_memory";
  };
  language_behavior: {
    reply_language_target: RuntimeReplyLanguage;
    reply_language_source: ReplyLanguageSource;
    same_thread_continuation_preferred: boolean;
  };
  memory_handoff?: {
    handoff_version: "v1";
    namespace_phase_snapshot_id: string;
    namespace_phase_snapshot_summary: string;
    retention_phase_snapshot_id: string | null;
    retention_phase_snapshot_summary: string | null;
    retention_decision_group?: string | null;
    retention_retained_fields?: string[];
    knowledge_phase_snapshot_id: string;
    knowledge_phase_snapshot_summary: string;
    knowledge_scope_layers?: string[];
    knowledge_governance_classes?: string[];
    scenario_phase_snapshot_id: string;
    scenario_phase_snapshot_summary: string;
    scenario_strategy_bundle_id?: string | null;
    scenario_orchestration_mode?: string | null;
  } | null;
};

export function getRoleCoreRelationshipStance(
  relationshipRecall: {
    addressStyleMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  }
): RoleCorePacket["relationship_stance"] {
  const styleValue = relationshipRecall.addressStyleMemory?.content ?? null;

  if (
    styleValue === "formal" ||
    styleValue === "friendly" ||
    styleValue === "casual" ||
    styleValue === "no_full_name"
  ) {
    return {
      effective: styleValue,
      source: "relationship_memory"
    };
  }

  return {
    effective: "default-agent-profile",
    source: "agent_profile_default"
  };
}

export function buildRoleCorePacket({
  agent,
  replyLanguage,
  replyLanguageSource,
  preferSameThreadContinuation,
  relationshipRecall
}: {
  agent: RoleProfile;
  replyLanguage: RuntimeReplyLanguage;
  replyLanguageSource: ReplyLanguageSource;
  preferSameThreadContinuation: boolean;
  relationshipRecall: {
    addressStyleMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  };
}): RoleCorePacket {
  return {
    packet_version: "v1",
    identity: {
      agent_id: agent.id,
      agent_name: agent.name
    },
    persona_summary: agent.persona_summary || null,
    style_guidance: agent.style_prompt || null,
    relationship_stance: getRoleCoreRelationshipStance(relationshipRecall),
    language_behavior: {
      reply_language_target: replyLanguage,
      reply_language_source: replyLanguageSource,
      same_thread_continuation_preferred: preferSameThreadContinuation
    },
    memory_handoff: null
  };
}

export function withRoleCoreMemoryHandoff(args: {
  packet: RoleCorePacket;
  memoryHandoff: NonNullable<RoleCorePacket["memory_handoff"]>;
}): RoleCorePacket {
  return {
    ...args.packet,
    packet_version: "v2",
    memory_handoff: args.memoryHandoff
  };
}
