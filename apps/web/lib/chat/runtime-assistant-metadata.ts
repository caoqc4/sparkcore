import type {
  BuildAssistantMessageMetadataInput,
} from "@/lib/chat/assistant-message-metadata";
import type { MemorySemanticLayer } from "@/lib/chat/memory-shared";
import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type {
  ReplyLanguageSource,
  RoleCorePacket,
  RuntimeReplyLanguage,
} from "@/lib/chat/role-core";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  resolveScenarioMemoryPackStrategy,
  type ActiveScenarioMemoryPack
} from "@/lib/chat/memory-packs";
import {
  buildKnowledgeSummary,
  resolveKnowledgeGovernanceClass,
  resolveKnowledgeScopeLayer,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import {
  resolveRuntimeMemoryBoundary,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
import type { CompactedThreadSummary } from "../../../../packages/core/memory";

type RecalledMemoryMetadataItem = BuildAssistantMessageMetadataInput["recalled_memories"][number];

export type BuildRuntimeAssistantMetadataInput = {
  agent: {
    id: string;
    name: string;
  };
  model: {
    result_model: string | null;
    provider: string;
    requested: string;
    profile_id: string;
    profile_name: string;
    profile_tier_label: string | null;
    profile_usage_note: string | null;
    underlying_label: string;
  };
  runtime: {
    role_core_packet: RoleCorePacket;
    runtime_input: RuntimeTurnInput;
    session_thread_id: string;
    session_agent_id: string;
    current_message_id?: string | null;
    recent_raw_turn_count: number;
    approx_context_pressure: ApproxContextPressure;
  };
  reply_language: {
    target: RuntimeReplyLanguage;
    detected: RuntimeReplyLanguage;
    source: ReplyLanguageSource;
  };
  answer: {
    question_type: string;
    strategy: string;
    strategy_reason_code: string | null;
    strategy_priority: string;
    strategy_priority_label: string;
  };
  session: {
    continuation_reason_code: string | null;
    thread_state: {
      lifecycle_status: string | null;
      focus_mode: string | null;
      continuity_status: string | null;
      current_language_hint: string | null;
    } | null;
    same_thread_continuation_applicable: boolean;
    long_chain_pressure_candidate: boolean;
    same_thread_continuation_preferred: boolean;
    distant_memory_fallback_allowed: boolean;
  };
  memory: {
    recalled_memories: RecalledMemoryMetadataItem[];
    hit_count: number;
    used: boolean;
    types_used: string[];
    semantic_layers: MemorySemanticLayer[];
    profile_snapshot: string[];
    scenario_pack: ActiveScenarioMemoryPack | null;
    hidden_exclusion_count: number;
    incorrect_exclusion_count: number;
  };
  knowledge: {
    snippets: RuntimeKnowledgeSnippet[];
  };
  namespace: {
    active_namespace: ActiveRuntimeMemoryNamespace | null;
  };
  compaction: {
    summary: CompactedThreadSummary | null;
  };
  follow_up: {
    request_count: number;
  };
};

export function buildRuntimeAssistantMetadataInput(
  input: BuildRuntimeAssistantMetadataInput
): BuildAssistantMessageMetadataInput {
  const scenarioPackStrategy = input.memory.scenario_pack
    ? resolveScenarioMemoryPackStrategy(input.memory.scenario_pack)
    : null;
  const namespaceBoundary = input.namespace.active_namespace
    ? resolveRuntimeMemoryBoundary(input.namespace.active_namespace)
    : null;
  const knowledgeSummary = buildKnowledgeSummary({
    knowledge: input.knowledge.snippets,
    activeNamespace: input.namespace.active_namespace ?? null
  });

  return {
    agent_id: input.agent.id,
    agent_name: input.agent.name,
    model: input.model.result_model,
    model_provider: input.model.provider,
    model_requested: input.model.requested,
    model_profile_id: input.model.profile_id,
    model_profile_name: input.model.profile_name,
    model_profile_tier_label: input.model.profile_tier_label,
    model_profile_usage_note: input.model.profile_usage_note,
    underlying_model_label: input.model.underlying_label,
    role_core_packet: input.runtime.role_core_packet,
    runtime_input: input.runtime.runtime_input,
    session_thread_id: input.runtime.session_thread_id,
    session_agent_id: input.runtime.session_agent_id,
    current_message_id: input.runtime.current_message_id,
    recent_raw_turn_count: input.runtime.recent_raw_turn_count,
    approx_context_pressure: input.runtime.approx_context_pressure,
    reply_language_target: input.reply_language.target,
    reply_language_detected: input.reply_language.detected,
    reply_language_source: input.reply_language.source,
    question_type: input.answer.question_type,
    answer_strategy: input.answer.strategy,
    answer_strategy_reason_code: input.answer.strategy_reason_code,
    answer_strategy_priority: input.answer.strategy_priority,
    answer_strategy_priority_label: input.answer.strategy_priority_label,
    continuation_reason_code: input.session.continuation_reason_code,
    thread_state_lifecycle_status:
      input.session.thread_state?.lifecycle_status ?? null,
    thread_state_focus_mode: input.session.thread_state?.focus_mode ?? null,
    thread_state_continuity_status:
      input.session.thread_state?.continuity_status ?? null,
    thread_state_current_language_hint:
      input.session.thread_state?.current_language_hint ?? null,
    same_thread_continuation_applicable:
      input.session.same_thread_continuation_applicable,
    long_chain_pressure_candidate: input.session.long_chain_pressure_candidate,
    same_thread_continuation_preferred:
      input.session.same_thread_continuation_preferred,
    distant_memory_fallback_allowed:
      input.session.distant_memory_fallback_allowed,
    recalled_memories: input.memory.recalled_memories,
    memory_hit_count: input.memory.hit_count,
    memory_used: input.memory.used,
    memory_types_used: input.memory.types_used,
    memory_semantic_layers: input.memory.semantic_layers,
    profile_snapshot: input.memory.profile_snapshot,
    scenario_memory_pack_id: input.memory.scenario_pack?.pack_id ?? null,
    scenario_memory_pack_label: input.memory.scenario_pack?.label ?? null,
    scenario_memory_pack_preferred_routes:
      input.memory.scenario_pack?.preferred_routes ?? [],
    scenario_memory_pack_assembly_order:
      input.memory.scenario_pack?.assembly_order ?? [],
    scenario_memory_pack_selection_reason:
      input.memory.scenario_pack?.selection_reason ?? null,
    scenario_memory_pack_knowledge_priority_layer:
      input.memory.scenario_pack?.knowledge_priority_layer ?? null,
    scenario_memory_pack_assembly_emphasis:
      input.memory.scenario_pack?.assembly_emphasis ?? null,
    scenario_memory_pack_knowledge_route_weight:
      input.memory.scenario_pack?.knowledge_route_weight ?? null,
    scenario_memory_pack_knowledge_budget_weight:
      input.memory.scenario_pack?.knowledge_budget_weight ?? null,
    scenario_memory_pack_route_influence_reason:
      input.memory.scenario_pack?.route_influence_reason ?? null,
    scenario_memory_pack_governance_route_bias:
      input.memory.scenario_pack?.governance_route_bias ?? null,
    scenario_memory_pack_strategy_policy_id:
      input.memory.scenario_pack?.strategy_policy_id ?? null,
    scenario_memory_pack_orchestration_mode:
      input.memory.scenario_pack?.orchestration_mode ?? null,
    scenario_memory_pack_orchestration_digest_id:
      input.memory.scenario_pack?.orchestration_digest_id ?? null,
    scenario_memory_pack_strategy_rationale_summary:
      input.memory.scenario_pack?.strategy_rationale_summary ?? null,
    scenario_memory_pack_orchestration_coordination_summary:
      input.memory.scenario_pack?.orchestration_coordination_summary ?? null,
    scenario_memory_pack_strategy_consistency_mode:
      input.memory.scenario_pack?.strategy_consistency_mode ?? null,
    scenario_memory_pack_governance_convergence_digest_id:
      input.memory.scenario_pack?.governance_convergence_digest_id ?? null,
    scenario_memory_pack_strategy_convergence_summary:
      input.memory.scenario_pack?.strategy_convergence_summary ?? null,
    scenario_memory_pack_orchestration_alignment_mode:
      input.memory.scenario_pack?.orchestration_alignment_mode ?? null,
    scenario_memory_pack_strategy_bundle_id:
      scenarioPackStrategy?.strategy_bundle_id ?? null,
    scenario_memory_pack_strategy_assembly_order:
      scenarioPackStrategy?.assembly_layer_order ?? [],
    hidden_memory_exclusion_count: input.memory.hidden_exclusion_count,
    incorrect_memory_exclusion_count: input.memory.incorrect_exclusion_count,
    knowledge_count: knowledgeSummary.count,
    knowledge_titles: knowledgeSummary.titles,
    knowledge_source_kinds: knowledgeSummary.source_kinds,
    knowledge_scope_layers: knowledgeSummary.scope_layers,
    knowledge_governance_classes: knowledgeSummary.governance_classes,
    knowledge_governance_coordination_summary:
      knowledgeSummary.governance_coordination_summary,
    knowledge_budget_coordination_mode:
      knowledgeSummary.budget_coordination_mode,
    knowledge_source_governance_summary:
      knowledgeSummary.source_governance_summary,
    knowledge_governance_consistency_mode:
      knowledgeSummary.governance_consistency_mode,
    knowledge_governance_convergence_digest:
      knowledgeSummary.governance_convergence_digest,
    knowledge_source_budget_alignment_summary:
      knowledgeSummary.source_budget_alignment_summary,
    knowledge_governance_alignment_mode:
      knowledgeSummary.governance_alignment_mode,
    active_memory_namespace_id:
      input.namespace.active_namespace?.namespace_id ?? null,
    active_memory_namespace_primary_layer:
      input.namespace.active_namespace?.primary_layer ?? null,
    active_memory_namespace_layers:
      input.namespace.active_namespace?.active_layers ?? [],
    active_memory_namespace_selection_reason:
      input.namespace.active_namespace?.selection_reason ?? null,
    active_memory_namespace_policy_bundle_id:
      namespaceBoundary?.policy_bundle_id ?? null,
    active_memory_namespace_policy_digest_id:
      namespaceBoundary?.policy_digest_id ?? null,
    active_memory_namespace_governance_convergence_digest_id:
      namespaceBoundary?.governance_convergence_digest_id ?? null,
    active_memory_namespace_unified_governance_runtime_digest_id:
      namespaceBoundary?.unified_governance_runtime_digest_id ?? null,
    active_memory_namespace_policy_coordination_summary:
      namespaceBoundary?.policy_coordination_summary ?? null,
    active_memory_namespace_governance_consistency_mode:
      namespaceBoundary?.governance_consistency_mode ?? null,
    active_memory_namespace_route_governance_mode:
      namespaceBoundary?.route_governance_mode ?? null,
    active_memory_retrieval_fallback_mode:
      namespaceBoundary?.retrieval_fallback_mode ?? null,
    active_memory_write_escalation_mode:
      namespaceBoundary?.write_escalation_mode ?? null,
    active_memory_namespace_governance_convergence_summary:
      namespaceBoundary?.governance_convergence_summary ?? null,
    active_memory_namespace_unified_governance_runtime_summary:
      namespaceBoundary?.unified_governance_runtime_summary ?? null,
    active_memory_namespace_unified_runtime_alignment_mode:
      namespaceBoundary?.unified_runtime_alignment_mode ?? null,
    active_memory_namespace_retrieval_write_digest_alignment:
      namespaceBoundary?.retrieval_write_digest_alignment ?? null,
    compacted_thread_summary_id: input.compaction.summary?.summary_id ?? null,
    compacted_thread_summary_text: input.compaction.summary?.summary_text ?? null,
    compacted_thread_summary_lifecycle_status:
      input.compaction.summary?.lifecycle_status ?? null,
    compacted_thread_summary_continuity_status:
      input.compaction.summary?.continuity_status ?? null,
    compacted_thread_retention_mode:
      input.compaction.summary?.retention_mode ?? null,
    compacted_thread_retention_reason:
      input.compaction.summary?.retention_reason ?? null,
    compacted_thread_retention_policy_id:
      input.compaction.summary?.retention_policy_id ?? null,
    compacted_thread_cross_layer_survival_mode:
      input.compaction.summary?.cross_layer_survival_mode ?? null,
    compacted_thread_retention_decision_group:
      input.compaction.summary?.retention_decision_group ?? null,
    compacted_thread_survival_rationale:
      input.compaction.summary?.survival_rationale ?? null,
    compacted_thread_lifecycle_governance_digest:
      input.compaction.summary?.lifecycle_governance_digest ?? null,
    compacted_thread_keep_drop_governance_summary:
      input.compaction.summary?.keep_drop_governance_summary ?? null,
    compacted_thread_lifecycle_coordination_summary:
      input.compaction.summary?.lifecycle_coordination_summary ?? null,
    compacted_thread_survival_consistency_mode:
      input.compaction.summary?.survival_consistency_mode ?? null,
    compacted_thread_lifecycle_convergence_digest:
      input.compaction.summary?.lifecycle_convergence_digest ?? null,
    compacted_thread_keep_drop_convergence_summary:
      input.compaction.summary?.keep_drop_convergence_summary ?? null,
    compacted_thread_lifecycle_alignment_mode:
      input.compaction.summary?.lifecycle_alignment_mode ?? null,
    compacted_thread_retained_fields:
      input.compaction.summary?.retained_fields ?? [],
    follow_up_request_count: input.follow_up.request_count,
  };
}
