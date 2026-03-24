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

export type RoleCoreMemoryCloseNoteHandoffPacket = {
  packet_version: "v1";
  source_packet_version: RoleCorePacket["packet_version"];
  handoff_version: NonNullable<RoleCorePacket["memory_handoff"]>["handoff_version"];
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended: boolean;
  blocking_items: string[];
  non_blocking_items: string[];
  tail_candidate_items: string[];
  namespace: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
  };
  retention: {
    phase_snapshot_id: string | null;
    phase_snapshot_summary: string | null;
    decision_group: string | null;
    retained_fields: string[];
  };
  knowledge: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    scope_layers: string[];
    governance_classes: string[];
  };
  scenario: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    strategy_bundle_id: string | null;
    orchestration_mode: string | null;
  };
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

export function buildRoleCoreMemoryCloseNoteHandoffPacket(args: {
  roleCorePacket: RoleCorePacket;
  readinessJudgment: string;
  progressRange: string;
  closeCandidate: boolean;
  closeNoteRecommended: boolean;
  blockingItems: string[];
  nonBlockingItems: string[];
  tailCandidateItems: string[];
}): RoleCoreMemoryCloseNoteHandoffPacket | null {
  const memoryHandoff = args.roleCorePacket.memory_handoff;

  if (!memoryHandoff) {
    return null;
  }

  return {
    packet_version: "v1",
    source_packet_version: args.roleCorePacket.packet_version,
    handoff_version: memoryHandoff.handoff_version,
    readiness_judgment: args.readinessJudgment,
    progress_range: args.progressRange,
    close_candidate: args.closeCandidate,
    close_note_recommended: args.closeNoteRecommended,
    blocking_items: args.blockingItems,
    non_blocking_items: args.nonBlockingItems,
    tail_candidate_items: args.tailCandidateItems,
    namespace: {
      phase_snapshot_id: memoryHandoff.namespace_phase_snapshot_id,
      phase_snapshot_summary: memoryHandoff.namespace_phase_snapshot_summary
    },
    retention: {
      phase_snapshot_id: memoryHandoff.retention_phase_snapshot_id,
      phase_snapshot_summary: memoryHandoff.retention_phase_snapshot_summary,
      decision_group: memoryHandoff.retention_decision_group ?? null,
      retained_fields: memoryHandoff.retention_retained_fields ?? []
    },
    knowledge: {
      phase_snapshot_id: memoryHandoff.knowledge_phase_snapshot_id,
      phase_snapshot_summary: memoryHandoff.knowledge_phase_snapshot_summary,
      scope_layers: memoryHandoff.knowledge_scope_layers ?? [],
      governance_classes: memoryHandoff.knowledge_governance_classes ?? []
    },
    scenario: {
      phase_snapshot_id: memoryHandoff.scenario_phase_snapshot_id,
      phase_snapshot_summary: memoryHandoff.scenario_phase_snapshot_summary,
      strategy_bundle_id: memoryHandoff.scenario_strategy_bundle_id ?? null,
      orchestration_mode: memoryHandoff.scenario_orchestration_mode ?? null
    }
  };
}
