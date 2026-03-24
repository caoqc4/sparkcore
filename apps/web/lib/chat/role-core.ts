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
  acceptance_gap_buckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  next_expansion_focus: string[];
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

export type RoleCoreMemoryCloseNoteArtifact = {
  artifact_version: "v1";
  source_packet_version: RoleCorePacket["packet_version"];
  source_handoff_packet_version: RoleCoreMemoryCloseNoteHandoffPacket["packet_version"];
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended: boolean;
  headline: string;
  carry_through_summary: string;
  acceptance_summary: string;
  blocking_items: string[];
  non_blocking_items: string[];
  tail_candidate_items: string[];
  acceptance_gap_buckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  next_expansion_focus: string[];
  sections: {
    namespace: string;
    retention: string;
    knowledge: string;
    scenario: string;
  };
};

export type RoleCoreMemoryCloseNoteOutput = {
  output_version: "v1";
  source_artifact_version: RoleCoreMemoryCloseNoteArtifact["artifact_version"];
  source_handoff_packet_version: RoleCoreMemoryCloseNoteHandoffPacket["packet_version"];
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended: boolean;
  headline: string;
  emission_summary: string;
  blocking_items: string[];
  non_blocking_items: string[];
  tail_candidate_items: string[];
  acceptance_gap_buckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  next_expansion_focus: string[];
  namespace: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    output_summary: string;
  };
  retention: {
    phase_snapshot_id: string | null;
    phase_snapshot_summary: string | null;
    decision_group: string | null;
    retained_fields: string[];
    output_summary: string;
  };
  knowledge: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    scope_layers: string[];
    governance_classes: string[];
    output_summary: string;
  };
  scenario: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    strategy_bundle_id: string | null;
    orchestration_mode: string | null;
    output_summary: string;
  };
};

export type RoleCoreMemoryCloseNoteRecord = {
  record_version: "v1";
  source_output_version: RoleCoreMemoryCloseNoteOutput["output_version"];
  source_artifact_version: RoleCoreMemoryCloseNoteArtifact["artifact_version"];
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended: boolean;
  headline: string;
  record_summary: string;
  blocking_items: string[];
  non_blocking_items: string[];
  tail_candidate_items: string[];
  acceptance_gap_buckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  next_expansion_focus: string[];
  namespace: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    record_summary: string;
  };
  retention: {
    phase_snapshot_id: string | null;
    phase_snapshot_summary: string | null;
    decision_group: string | null;
    retained_fields: string[];
    record_summary: string;
  };
  knowledge: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    scope_layers: string[];
    governance_classes: string[];
    record_summary: string;
  };
  scenario: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    strategy_bundle_id: string | null;
    orchestration_mode: string | null;
    record_summary: string;
  };
};

export type RoleCoreMemoryCloseNoteArchive = {
  archive_version: "v1";
  source_record_version: RoleCoreMemoryCloseNoteRecord["record_version"];
  source_output_version: RoleCoreMemoryCloseNoteOutput["output_version"];
  readiness_judgment: string;
  progress_range: string;
  close_candidate: boolean;
  close_note_recommended: boolean;
  headline: string;
  archive_summary: string;
  blocking_items: string[];
  non_blocking_items: string[];
  tail_candidate_items: string[];
  acceptance_gap_buckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  next_expansion_focus: string[];
  namespace: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    archive_summary: string;
  };
  retention: {
    phase_snapshot_id: string | null;
    phase_snapshot_summary: string | null;
    decision_group: string | null;
    retained_fields: string[];
    archive_summary: string;
  };
  knowledge: {
    phase_snapshot_id: string;
    phase_snapshot_summary: string;
    scope_layers: string[];
    governance_classes: string[];
    archive_summary: string;
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
  blockingItems: readonly string[];
  nonBlockingItems: readonly string[];
  tailCandidateItems: readonly string[];
  acceptanceGapBuckets: {
    blocking: number;
    non_blocking: number;
    tail_candidate: number;
  };
  nextExpansionFocus: readonly string[];
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
    blocking_items: [...args.blockingItems],
    non_blocking_items: [...args.nonBlockingItems],
    tail_candidate_items: [...args.tailCandidateItems],
    acceptance_gap_buckets: { ...args.acceptanceGapBuckets },
    next_expansion_focus: [...args.nextExpansionFocus],
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

export function buildRoleCoreMemoryCloseNoteArtifact(args: {
  roleCorePacket: RoleCorePacket;
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null;
}): RoleCoreMemoryCloseNoteArtifact | null {
  const closeNoteHandoffPacket = args.closeNoteHandoffPacket;

  if (!closeNoteHandoffPacket) {
    return null;
  }

  return {
    artifact_version: "v1",
    source_packet_version: args.roleCorePacket.packet_version,
    source_handoff_packet_version: closeNoteHandoffPacket.packet_version,
    readiness_judgment: closeNoteHandoffPacket.readiness_judgment,
    progress_range: closeNoteHandoffPacket.progress_range,
    close_candidate: closeNoteHandoffPacket.close_candidate,
    close_note_recommended: closeNoteHandoffPacket.close_note_recommended,
    headline: `${args.roleCorePacket.identity.agent_name} close-note artifact`,
    carry_through_summary: `blocking_items = ${closeNoteHandoffPacket.blocking_items.join(", ") || "none"}; non_blocking_items = ${closeNoteHandoffPacket.non_blocking_items.join(", ") || "none"}.`,
    acceptance_summary: `blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.blocking}; non_blocking = ${closeNoteHandoffPacket.acceptance_gap_buckets.non_blocking}; tail_candidate = ${closeNoteHandoffPacket.acceptance_gap_buckets.tail_candidate}.`,
    blocking_items: [...closeNoteHandoffPacket.blocking_items],
    non_blocking_items: [...closeNoteHandoffPacket.non_blocking_items],
    tail_candidate_items: [...closeNoteHandoffPacket.tail_candidate_items],
    acceptance_gap_buckets: {
      ...closeNoteHandoffPacket.acceptance_gap_buckets
    },
    next_expansion_focus: [...closeNoteHandoffPacket.next_expansion_focus],
    sections: {
      namespace: `${closeNoteHandoffPacket.namespace.phase_snapshot_id}; ${closeNoteHandoffPacket.namespace.phase_snapshot_summary}`,
      retention: closeNoteHandoffPacket.retention.phase_snapshot_id
        ? `${closeNoteHandoffPacket.retention.phase_snapshot_id}; ${closeNoteHandoffPacket.retention.phase_snapshot_summary ?? "none"}; decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}`
        : "none",
      knowledge: `${closeNoteHandoffPacket.knowledge.phase_snapshot_id}; scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}; governance_classes = ${closeNoteHandoffPacket.knowledge.governance_classes.join(", ") || "none"}`,
      scenario: `${closeNoteHandoffPacket.scenario.phase_snapshot_id}; strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}; orchestration_mode = ${closeNoteHandoffPacket.scenario.orchestration_mode ?? "none"}`
    }
  };
}

export function buildRoleCoreMemoryCloseNoteOutput(args: {
  roleCorePacket: RoleCorePacket;
  closeNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null;
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null;
}): RoleCoreMemoryCloseNoteOutput | null {
  const closeNoteHandoffPacket = args.closeNoteHandoffPacket;
  const closeNoteArtifact = args.closeNoteArtifact;

  if (!closeNoteHandoffPacket || !closeNoteArtifact) {
    return null;
  }

  const blockingItems: string[] = [];
  const nonBlockingItems = [
    "output_regression_gate_layering",
    "close_readiness_output_consumption",
    "remaining_output_acceptance_gaps"
  ];
  const tailCandidateItems = [
    "output_surface_symmetry_cleanup",
    "non_blocking_output_negative_coverage",
    "artifact_to_output_alignment_cleanup"
  ];
  const acceptanceGapBuckets = {
    blocking: blockingItems.length,
    non_blocking: nonBlockingItems.length,
    tail_candidate: tailCandidateItems.length
  } as const;
  const nextExpansionFocus = [...nonBlockingItems];

  return {
    output_version: "v1",
    source_artifact_version: closeNoteArtifact.artifact_version,
    source_handoff_packet_version: closeNoteHandoffPacket.packet_version,
    readiness_judgment: "close_ready",
    progress_range: "80% - 85%",
    close_candidate: closeNoteArtifact.close_candidate,
    close_note_recommended: true,
    headline: `${args.roleCorePacket.identity.agent_name} close-note output`,
    emission_summary: `namespace_output_started; retention_output_started; knowledge_output_started; scenario_output_started; source_artifact = ${closeNoteArtifact.artifact_version}; blocking_items = none; non_blocking_items = ${nonBlockingItems.join(", ")}.`,
    blocking_items: [...blockingItems],
    non_blocking_items: [...nonBlockingItems],
    tail_candidate_items: [...tailCandidateItems],
    acceptance_gap_buckets: { ...acceptanceGapBuckets },
    next_expansion_focus: nextExpansionFocus,
    namespace: {
      phase_snapshot_id: closeNoteHandoffPacket.namespace.phase_snapshot_id,
      phase_snapshot_summary:
        closeNoteHandoffPacket.namespace.phase_snapshot_summary,
      output_summary: `${closeNoteHandoffPacket.namespace.phase_snapshot_id}; ${closeNoteHandoffPacket.namespace.phase_snapshot_summary}; artifact_headline = ${closeNoteArtifact.headline}`
    },
    retention: {
      phase_snapshot_id: closeNoteHandoffPacket.retention.phase_snapshot_id,
      phase_snapshot_summary:
        closeNoteHandoffPacket.retention.phase_snapshot_summary,
      decision_group: closeNoteHandoffPacket.retention.decision_group,
      retained_fields: [...closeNoteHandoffPacket.retention.retained_fields],
      output_summary: closeNoteHandoffPacket.retention.phase_snapshot_id
        ? `${closeNoteHandoffPacket.retention.phase_snapshot_id}; ${closeNoteHandoffPacket.retention.phase_snapshot_summary ?? "none"}; decision_group = ${closeNoteHandoffPacket.retention.decision_group ?? "none"}; retained_fields = ${closeNoteHandoffPacket.retention.retained_fields.join(", ") || "none"}`
        : "none"
    },
    knowledge: {
      phase_snapshot_id: closeNoteHandoffPacket.knowledge.phase_snapshot_id,
      phase_snapshot_summary:
        closeNoteHandoffPacket.knowledge.phase_snapshot_summary,
      scope_layers: [...closeNoteHandoffPacket.knowledge.scope_layers],
      governance_classes: [
        ...closeNoteHandoffPacket.knowledge.governance_classes
      ],
      output_summary: `${closeNoteHandoffPacket.knowledge.phase_snapshot_id}; ${closeNoteHandoffPacket.knowledge.phase_snapshot_summary}; scope_layers = ${closeNoteHandoffPacket.knowledge.scope_layers.join(", ") || "none"}; governance_classes = ${closeNoteHandoffPacket.knowledge.governance_classes.join(", ") || "none"}`
    },
    scenario: {
      phase_snapshot_id: closeNoteHandoffPacket.scenario.phase_snapshot_id,
      phase_snapshot_summary:
        closeNoteHandoffPacket.scenario.phase_snapshot_summary,
      strategy_bundle_id: closeNoteHandoffPacket.scenario.strategy_bundle_id,
      orchestration_mode: closeNoteHandoffPacket.scenario.orchestration_mode,
      output_summary: `${closeNoteHandoffPacket.scenario.phase_snapshot_id}; ${closeNoteHandoffPacket.scenario.phase_snapshot_summary}; strategy_bundle = ${closeNoteHandoffPacket.scenario.strategy_bundle_id ?? "none"}; orchestration_mode = ${closeNoteHandoffPacket.scenario.orchestration_mode ?? "none"}`
    }
  };
}

export function buildRoleCoreMemoryCloseNoteRecord(args: {
  roleCorePacket: RoleCorePacket;
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null;
  closeNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null;
}): RoleCoreMemoryCloseNoteRecord | null {
  const closeNoteOutput = args.closeNoteOutput;
  const closeNoteArtifact = args.closeNoteArtifact;

  if (!closeNoteOutput || !closeNoteArtifact) {
    return null;
  }

  return {
    record_version: "v1",
    source_output_version: closeNoteOutput.output_version,
    source_artifact_version: closeNoteArtifact.artifact_version,
    readiness_judgment: closeNoteOutput.readiness_judgment,
    progress_range: closeNoteOutput.progress_range,
    close_candidate: closeNoteOutput.close_candidate,
    close_note_recommended: closeNoteOutput.close_note_recommended,
    headline: `${args.roleCorePacket.identity.agent_name} close-note record`,
    record_summary: `namespace_record_started; retention_record_started; knowledge_record_started; scenario_record_started; source_output = ${closeNoteOutput.output_version}; readiness = ${closeNoteOutput.readiness_judgment}.`,
    blocking_items: [...closeNoteOutput.blocking_items],
    non_blocking_items: [...closeNoteOutput.non_blocking_items],
    tail_candidate_items: [...closeNoteOutput.tail_candidate_items],
    acceptance_gap_buckets: { ...closeNoteOutput.acceptance_gap_buckets },
    next_expansion_focus: [...closeNoteOutput.next_expansion_focus],
    namespace: {
      phase_snapshot_id: closeNoteOutput.namespace.phase_snapshot_id,
      phase_snapshot_summary: closeNoteOutput.namespace.phase_snapshot_summary,
      record_summary: `${closeNoteOutput.namespace.phase_snapshot_id}; ${closeNoteOutput.namespace.phase_snapshot_summary}; output_headline = ${closeNoteOutput.headline}`
    },
    retention: {
      phase_snapshot_id: closeNoteOutput.retention.phase_snapshot_id,
      phase_snapshot_summary: closeNoteOutput.retention.phase_snapshot_summary,
      decision_group: closeNoteOutput.retention.decision_group,
      retained_fields: [...closeNoteOutput.retention.retained_fields],
      record_summary: closeNoteOutput.retention.phase_snapshot_id
        ? `${closeNoteOutput.retention.phase_snapshot_id}; ${closeNoteOutput.retention.phase_snapshot_summary ?? "none"}; decision_group = ${closeNoteOutput.retention.decision_group ?? "none"}; retained_fields = ${closeNoteOutput.retention.retained_fields.join(", ") || "none"}`
        : "none"
    },
    knowledge: {
      phase_snapshot_id: closeNoteOutput.knowledge.phase_snapshot_id,
      phase_snapshot_summary: closeNoteOutput.knowledge.phase_snapshot_summary,
      scope_layers: [...closeNoteOutput.knowledge.scope_layers],
      governance_classes: [...closeNoteOutput.knowledge.governance_classes],
      record_summary: `${closeNoteOutput.knowledge.phase_snapshot_id}; ${closeNoteOutput.knowledge.phase_snapshot_summary}; scope_layers = ${closeNoteOutput.knowledge.scope_layers.join(", ") || "none"}; governance_classes = ${closeNoteOutput.knowledge.governance_classes.join(", ") || "none"}`
    },
    scenario: {
      phase_snapshot_id: closeNoteOutput.scenario.phase_snapshot_id,
      phase_snapshot_summary: closeNoteOutput.scenario.phase_snapshot_summary,
      strategy_bundle_id: closeNoteOutput.scenario.strategy_bundle_id,
      orchestration_mode: closeNoteOutput.scenario.orchestration_mode,
      record_summary: `${closeNoteOutput.scenario.phase_snapshot_id}; ${closeNoteOutput.scenario.phase_snapshot_summary}; strategy_bundle = ${closeNoteOutput.scenario.strategy_bundle_id ?? "none"}; orchestration_mode = ${closeNoteOutput.scenario.orchestration_mode ?? "none"}`
    }
  };
}

export function buildRoleCoreMemoryCloseNoteArchive(args: {
  roleCorePacket: RoleCorePacket;
  closeNoteRecord: RoleCoreMemoryCloseNoteRecord | null;
  closeNoteOutput: RoleCoreMemoryCloseNoteOutput | null;
}): RoleCoreMemoryCloseNoteArchive | null {
  const closeNoteRecord = args.closeNoteRecord;
  const closeNoteOutput = args.closeNoteOutput;

  if (!closeNoteRecord || !closeNoteOutput) {
    return null;
  }

  return {
    archive_version: "v1",
    source_record_version: closeNoteRecord.record_version,
    source_output_version: closeNoteOutput.output_version,
    readiness_judgment: closeNoteRecord.readiness_judgment,
    progress_range: closeNoteRecord.progress_range,
    close_candidate: closeNoteRecord.close_candidate,
    close_note_recommended: closeNoteRecord.close_note_recommended,
    headline: `${args.roleCorePacket.identity.agent_name} close-note archive`,
    archive_summary: `namespace_archive_started; source_record = ${closeNoteRecord.record_version}; readiness = ${closeNoteRecord.readiness_judgment}.`,
    blocking_items: [...closeNoteRecord.blocking_items],
    non_blocking_items: [...closeNoteRecord.non_blocking_items],
    tail_candidate_items: [...closeNoteRecord.tail_candidate_items],
    acceptance_gap_buckets: { ...closeNoteRecord.acceptance_gap_buckets },
    next_expansion_focus: [...closeNoteRecord.next_expansion_focus],
    namespace: {
      phase_snapshot_id: closeNoteRecord.namespace.phase_snapshot_id,
      phase_snapshot_summary: closeNoteRecord.namespace.phase_snapshot_summary,
      archive_summary: `${closeNoteRecord.namespace.phase_snapshot_id}; ${closeNoteRecord.namespace.phase_snapshot_summary}; record_headline = ${closeNoteRecord.headline}`
    },
    retention: {
      phase_snapshot_id: closeNoteRecord.retention.phase_snapshot_id,
      phase_snapshot_summary: closeNoteRecord.retention.phase_snapshot_summary,
      decision_group: closeNoteRecord.retention.decision_group,
      retained_fields: [...closeNoteRecord.retention.retained_fields],
      archive_summary: closeNoteRecord.retention.phase_snapshot_id
        ? `${closeNoteRecord.retention.phase_snapshot_id}; ${closeNoteRecord.retention.phase_snapshot_summary ?? "none"}; decision_group = ${closeNoteRecord.retention.decision_group ?? "none"}; retained_fields = ${closeNoteRecord.retention.retained_fields.join(", ") || "none"}`
        : "none"
    },
    knowledge: {
      phase_snapshot_id: closeNoteRecord.knowledge.phase_snapshot_id,
      phase_snapshot_summary: closeNoteRecord.knowledge.phase_snapshot_summary,
      scope_layers: [...closeNoteRecord.knowledge.scope_layers],
      governance_classes: [...closeNoteRecord.knowledge.governance_classes],
      archive_summary: `${closeNoteRecord.knowledge.phase_snapshot_id}; ${closeNoteRecord.knowledge.phase_snapshot_summary}; scope_layers = ${closeNoteRecord.knowledge.scope_layers.join(", ") || "none"}; governance_classes = ${closeNoteRecord.knowledge.governance_classes.join(", ") || "none"}`
    }
  };
}
