import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type { MemorySemanticLayer } from "@/lib/chat/memory-shared";
import type { ReplyLanguageSource, RoleCorePacket, RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import { buildRuntimeMemorySemanticSummary } from "@/lib/chat/memory-records";
import type { ScenarioMemoryLayer, ScenarioMemoryRoute } from "../../../../packages/core/memory";

type RecalledMemoryMetadataItem = {
  memory_type: string | null;
  content: string;
  confidence: number | null;
  semantic_layer?: string | null;
};

export type BuildAssistantMetadataSummaryGroupsInput = {
  model_profile_id: string;
  model_profile_name: string;
  model_profile_tier_label: string | null;
  model_profile_usage_note: string | null;
  underlying_model_label: string;
  reply_language_target: RuntimeReplyLanguage;
  reply_language_detected: RuntimeReplyLanguage;
  reply_language_source: ReplyLanguageSource;
  question_type: string;
  answer_strategy: string;
  answer_strategy_reason_code: string | null;
  answer_strategy_priority: string | null;
  answer_strategy_priority_label: string | null;
  continuation_reason_code: string | null;
  thread_state_lifecycle_status?: string | null;
  thread_state_focus_mode?: string | null;
  thread_state_continuity_status?: string | null;
  thread_state_current_language_hint?: string | null;
  recent_raw_turn_count: number;
  approx_context_pressure: ApproxContextPressure;
  memory_hit_count: number;
  memory_used: boolean;
  memory_types_used: string[];
  memory_semantic_layers: MemorySemanticLayer[];
  profile_snapshot: string[];
  scenario_memory_pack_id?: string | null;
  scenario_memory_pack_label?: string | null;
  scenario_memory_pack_preferred_routes?: ScenarioMemoryRoute[];
  scenario_memory_pack_assembly_order?: ScenarioMemoryLayer[];
  scenario_memory_pack_selection_reason?: string | null;
  scenario_memory_pack_knowledge_priority_layer?: string | null;
  scenario_memory_pack_assembly_emphasis?: string | null;
  scenario_memory_pack_knowledge_route_weight?: number | null;
  scenario_memory_pack_knowledge_budget_weight?: number | null;
  scenario_memory_pack_route_influence_reason?: string | null;
  scenario_memory_pack_governance_route_bias?: string | null;
  scenario_memory_pack_strategy_policy_id?: string | null;
  scenario_memory_pack_orchestration_mode?: string | null;
  scenario_memory_pack_orchestration_digest_id?: string | null;
  scenario_memory_pack_strategy_rationale_summary?: string | null;
  scenario_memory_pack_orchestration_coordination_summary?: string | null;
  scenario_memory_pack_strategy_consistency_mode?: string | null;
  scenario_memory_pack_governance_convergence_digest_id?: string | null;
  scenario_memory_pack_strategy_convergence_summary?: string | null;
  scenario_memory_pack_orchestration_alignment_mode?: string | null;
  scenario_memory_pack_governance_unification_digest_id?: string | null;
  scenario_memory_pack_strategy_unification_summary?: string | null;
  scenario_memory_pack_orchestration_unification_mode?: string | null;
  scenario_memory_pack_governance_consolidation_digest_id?: string | null;
  scenario_memory_pack_strategy_consolidation_summary?: string | null;
  scenario_memory_pack_orchestration_consolidation_mode?: string | null;
  scenario_memory_pack_governance_coordination_digest_id?: string | null;
  scenario_memory_pack_strategy_runtime_coordination_summary?: string | null;
  scenario_memory_pack_orchestration_coordination_mode_v9?: string | null;
  scenario_memory_pack_strategy_runtime_reuse_summary?: string | null;
  scenario_memory_pack_governance_coordination_reuse_mode?: string | null;
  scenario_memory_pack_governance_plane_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_plane_summary?: string | null;
  scenario_memory_pack_orchestration_governance_plane_mode?: string | null;
  scenario_memory_pack_governance_plane_reuse_mode?: string | null;
  scenario_memory_pack_governance_fabric_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_fabric_summary?: string | null;
  scenario_memory_pack_orchestration_governance_fabric_mode?: string | null;
  scenario_memory_pack_governance_fabric_reuse_mode?: string | null;
  scenario_memory_pack_governance_fabric_plane_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_fabric_plane_summary?: string | null;
  scenario_memory_pack_orchestration_governance_fabric_plane_mode?: string | null;
  scenario_memory_pack_governance_fabric_plane_reuse_mode?: string | null;
  scenario_memory_pack_strategy_bundle_id?: string | null;
  scenario_memory_pack_strategy_assembly_order?: string[];
  knowledge_count?: number;
  knowledge_titles?: string[];
  knowledge_source_kinds?: string[];
  knowledge_scope_layers?: string[];
  knowledge_governance_classes?: string[];
  knowledge_governance_coordination_summary?: string | null;
  knowledge_budget_coordination_mode?: string | null;
  knowledge_source_governance_summary?: string | null;
  knowledge_governance_consistency_mode?: string | null;
  knowledge_governance_convergence_digest?: string | null;
  knowledge_source_budget_alignment_summary?: string | null;
  knowledge_governance_alignment_mode?: string | null;
  knowledge_governance_unification_digest?: string | null;
  knowledge_source_budget_unification_summary?: string | null;
  knowledge_governance_unification_mode?: string | null;
  knowledge_governance_consolidation_digest?: string | null;
  knowledge_source_budget_consolidation_summary?: string | null;
  knowledge_governance_consolidation_mode?: string | null;
  knowledge_governance_coordination_digest?: string | null;
  knowledge_source_budget_coordination_summary?: string | null;
  knowledge_governance_coordination_mode_v9?: string | null;
  knowledge_selection_runtime_coordination_summary?: string | null;
  knowledge_governance_coordination_reuse_mode?: string | null;
  knowledge_governance_plane_digest?: string | null;
  knowledge_source_budget_governance_plane_summary?: string | null;
  knowledge_governance_plane_mode?: string | null;
  knowledge_governance_plane_reuse_mode?: string | null;
  knowledge_governance_fabric_digest?: string | null;
  knowledge_source_budget_governance_fabric_summary?: string | null;
  knowledge_governance_fabric_mode?: string | null;
  knowledge_governance_fabric_reuse_mode?: string | null;
  knowledge_governance_fabric_plane_digest?: string | null;
  knowledge_source_budget_governance_fabric_plane_summary?: string | null;
  knowledge_governance_fabric_plane_mode?: string | null;
  knowledge_governance_fabric_plane_reuse_mode?: string | null;
  active_memory_namespace_id?: string | null;
  active_memory_namespace_primary_layer?: string | null;
  active_memory_namespace_layers?: string[];
  active_memory_namespace_selection_reason?: string | null;
  active_memory_namespace_policy_bundle_id?: string | null;
  active_memory_namespace_policy_digest_id?: string | null;
  active_memory_namespace_governance_convergence_digest_id?: string | null;
  active_memory_namespace_unified_governance_runtime_digest_id?: string | null;
  active_memory_namespace_policy_coordination_summary?: string | null;
  active_memory_namespace_governance_consistency_mode?: string | null;
  active_memory_namespace_route_governance_mode?: string | null;
  active_memory_retrieval_fallback_mode?: string | null;
  active_memory_write_escalation_mode?: string | null;
  active_memory_namespace_governance_convergence_summary?: string | null;
  active_memory_namespace_unified_governance_runtime_summary?: string | null;
  active_memory_namespace_unified_runtime_alignment_mode?: string | null;
  active_memory_namespace_unified_runtime_reuse_mode?: string | null;
  active_memory_namespace_governance_consolidation_digest_id?: string | null;
  active_memory_namespace_governance_consolidation_summary?: string | null;
  active_memory_namespace_runtime_consolidation_mode?: string | null;
  active_memory_namespace_unified_governance_consolidation_digest_id?: string | null;
  active_memory_namespace_unified_governance_consolidation_summary?: string | null;
  active_memory_namespace_unified_consolidation_alignment_mode?: string | null;
  active_memory_namespace_unified_consolidation_reuse_mode?: string | null;
  active_memory_namespace_unified_consolidation_coordination_summary?: string | null;
  active_memory_namespace_unified_consolidation_consistency_mode?: string | null;
  active_memory_namespace_governance_plane_runtime_digest_id?: string | null;
  active_memory_namespace_governance_plane_runtime_summary?: string | null;
  active_memory_namespace_governance_plane_alignment_mode?: string | null;
  active_memory_namespace_governance_plane_reuse_mode?: string | null;
  active_memory_namespace_governance_fabric_runtime_digest_id?: string | null;
  active_memory_namespace_governance_fabric_runtime_summary?: string | null;
  active_memory_namespace_governance_fabric_alignment_mode?: string | null;
  active_memory_namespace_governance_fabric_reuse_mode?: string | null;
  active_memory_namespace_governance_fabric_plane_digest_id?: string | null;
  active_memory_namespace_governance_fabric_plane_summary?: string | null;
  active_memory_namespace_governance_fabric_plane_alignment_mode?: string | null;
  active_memory_namespace_governance_fabric_plane_reuse_mode?: string | null;
  active_memory_namespace_retrieval_write_digest_alignment?: string | null;
  compacted_thread_summary_id?: string | null;
  compacted_thread_summary_text?: string | null;
  compacted_thread_summary_lifecycle_status?: string | null;
  compacted_thread_summary_continuity_status?: string | null;
  compacted_thread_retention_mode?: string | null;
  compacted_thread_retention_reason?: string | null;
  compacted_thread_retention_policy_id?: string | null;
  compacted_thread_cross_layer_survival_mode?: string | null;
  compacted_thread_retention_decision_group?: string | null;
  compacted_thread_survival_rationale?: string | null;
  compacted_thread_lifecycle_governance_digest?: string | null;
  compacted_thread_keep_drop_governance_summary?: string | null;
  compacted_thread_lifecycle_coordination_summary?: string | null;
  compacted_thread_survival_consistency_mode?: string | null;
  compacted_thread_lifecycle_convergence_digest?: string | null;
  compacted_thread_keep_drop_convergence_summary?: string | null;
  compacted_thread_lifecycle_alignment_mode?: string | null;
  compacted_thread_lifecycle_unification_digest?: string | null;
  compacted_thread_keep_drop_unification_summary?: string | null;
  compacted_thread_lifecycle_unification_mode?: string | null;
  compacted_thread_lifecycle_consolidation_digest?: string | null;
  compacted_thread_keep_drop_consolidation_summary?: string | null;
  compacted_thread_lifecycle_consolidation_mode?: string | null;
  compacted_thread_lifecycle_coordination_digest?: string | null;
  compacted_thread_keep_drop_consolidation_coordination_summary?: string | null;
  compacted_thread_lifecycle_coordination_alignment_mode?: string | null;
  compacted_thread_keep_drop_runtime_coordination_summary?: string | null;
  compacted_thread_lifecycle_coordination_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_plane_digest?: string | null;
  compacted_thread_keep_drop_governance_plane_summary?: string | null;
  compacted_thread_lifecycle_governance_plane_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_plane_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_digest?: string | null;
  compacted_thread_keep_drop_governance_fabric_summary?: string | null;
  compacted_thread_lifecycle_governance_fabric_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_digest?: string | null;
  compacted_thread_keep_drop_governance_fabric_plane_summary?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_reuse_mode?: string | null;
  compacted_thread_retained_fields?: string[];
  hidden_memory_exclusion_count: number;
  incorrect_memory_exclusion_count: number;
  follow_up_request_count: number;
};

export type BuildAssistantMessageMetadataInput = {
  agent_id: string;
  agent_name: string;
  model: string | null;
  model_provider: string;
  model_requested: string;
  model_profile_id: string;
  model_profile_name: string;
  model_profile_tier_label: string | null;
  model_profile_usage_note: string | null;
  underlying_model_label: string;
  role_core_packet: RoleCorePacket;
  runtime_input: RuntimeTurnInput;
  session_thread_id: string;
  session_agent_id: string;
  current_message_id?: string | null;
  recent_raw_turn_count: number;
  approx_context_pressure: ApproxContextPressure;
  reply_language_target: RuntimeReplyLanguage;
  reply_language_detected: RuntimeReplyLanguage;
  reply_language_source: ReplyLanguageSource;
  question_type: string;
  answer_strategy: string;
  answer_strategy_reason_code: string | null;
  answer_strategy_priority: string;
  answer_strategy_priority_label: string;
  continuation_reason_code: string | null;
  thread_state_lifecycle_status?: string | null;
  thread_state_focus_mode?: string | null;
  thread_state_continuity_status?: string | null;
  thread_state_current_language_hint?: string | null;
  same_thread_continuation_applicable: boolean;
  long_chain_pressure_candidate: boolean;
  same_thread_continuation_preferred: boolean;
  distant_memory_fallback_allowed: boolean;
  recalled_memories: RecalledMemoryMetadataItem[];
  memory_hit_count: number;
  memory_used: boolean;
  memory_types_used: string[];
  memory_semantic_layers: MemorySemanticLayer[];
  profile_snapshot: string[];
  scenario_memory_pack_id?: string | null;
  scenario_memory_pack_label?: string | null;
  scenario_memory_pack_preferred_routes?: ScenarioMemoryRoute[];
  scenario_memory_pack_assembly_order?: ScenarioMemoryLayer[];
  scenario_memory_pack_selection_reason?: string | null;
  scenario_memory_pack_knowledge_priority_layer?: string | null;
  scenario_memory_pack_assembly_emphasis?: string | null;
  scenario_memory_pack_knowledge_route_weight?: number | null;
  scenario_memory_pack_knowledge_budget_weight?: number | null;
  scenario_memory_pack_route_influence_reason?: string | null;
  scenario_memory_pack_governance_route_bias?: string | null;
  scenario_memory_pack_strategy_policy_id?: string | null;
  scenario_memory_pack_orchestration_mode?: string | null;
  scenario_memory_pack_orchestration_digest_id?: string | null;
  scenario_memory_pack_strategy_rationale_summary?: string | null;
  scenario_memory_pack_orchestration_coordination_summary?: string | null;
  scenario_memory_pack_strategy_consistency_mode?: string | null;
  scenario_memory_pack_governance_convergence_digest_id?: string | null;
  scenario_memory_pack_strategy_convergence_summary?: string | null;
  scenario_memory_pack_orchestration_alignment_mode?: string | null;
  scenario_memory_pack_governance_unification_digest_id?: string | null;
  scenario_memory_pack_strategy_unification_summary?: string | null;
  scenario_memory_pack_orchestration_unification_mode?: string | null;
  scenario_memory_pack_governance_consolidation_digest_id?: string | null;
  scenario_memory_pack_strategy_consolidation_summary?: string | null;
  scenario_memory_pack_orchestration_consolidation_mode?: string | null;
  scenario_memory_pack_governance_coordination_digest_id?: string | null;
  scenario_memory_pack_strategy_runtime_coordination_summary?: string | null;
  scenario_memory_pack_orchestration_coordination_mode_v9?: string | null;
  scenario_memory_pack_strategy_runtime_reuse_summary?: string | null;
  scenario_memory_pack_governance_coordination_reuse_mode?: string | null;
  scenario_memory_pack_governance_plane_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_plane_summary?: string | null;
  scenario_memory_pack_orchestration_governance_plane_mode?: string | null;
  scenario_memory_pack_governance_plane_reuse_mode?: string | null;
  scenario_memory_pack_governance_fabric_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_fabric_summary?: string | null;
  scenario_memory_pack_orchestration_governance_fabric_mode?: string | null;
  scenario_memory_pack_governance_fabric_reuse_mode?: string | null;
  scenario_memory_pack_governance_fabric_plane_digest_id?: string | null;
  scenario_memory_pack_strategy_governance_fabric_plane_summary?: string | null;
  scenario_memory_pack_orchestration_governance_fabric_plane_mode?: string | null;
  scenario_memory_pack_governance_fabric_plane_reuse_mode?: string | null;
  scenario_memory_pack_strategy_bundle_id?: string | null;
  scenario_memory_pack_strategy_assembly_order?: string[];
  knowledge_count?: number;
  knowledge_titles?: string[];
  knowledge_source_kinds?: string[];
  knowledge_scope_layers?: string[];
  knowledge_governance_classes?: string[];
  knowledge_governance_coordination_summary?: string | null;
  knowledge_budget_coordination_mode?: string | null;
  knowledge_source_governance_summary?: string | null;
  knowledge_governance_consistency_mode?: string | null;
  knowledge_governance_convergence_digest?: string | null;
  knowledge_source_budget_alignment_summary?: string | null;
  knowledge_governance_alignment_mode?: string | null;
  knowledge_governance_unification_digest?: string | null;
  knowledge_source_budget_unification_summary?: string | null;
  knowledge_governance_unification_mode?: string | null;
  knowledge_governance_consolidation_digest?: string | null;
  knowledge_source_budget_consolidation_summary?: string | null;
  knowledge_governance_consolidation_mode?: string | null;
  knowledge_governance_coordination_digest?: string | null;
  knowledge_source_budget_coordination_summary?: string | null;
  knowledge_governance_coordination_mode_v9?: string | null;
  knowledge_selection_runtime_coordination_summary?: string | null;
  knowledge_governance_coordination_reuse_mode?: string | null;
  knowledge_governance_plane_digest?: string | null;
  knowledge_source_budget_governance_plane_summary?: string | null;
  knowledge_governance_plane_mode?: string | null;
  knowledge_governance_plane_reuse_mode?: string | null;
  knowledge_governance_fabric_digest?: string | null;
  knowledge_source_budget_governance_fabric_summary?: string | null;
  knowledge_governance_fabric_mode?: string | null;
  knowledge_governance_fabric_reuse_mode?: string | null;
  knowledge_governance_fabric_plane_digest?: string | null;
  knowledge_source_budget_governance_fabric_plane_summary?: string | null;
  knowledge_governance_fabric_plane_mode?: string | null;
  knowledge_governance_fabric_plane_reuse_mode?: string | null;
  active_memory_namespace_id?: string | null;
  active_memory_namespace_primary_layer?: string | null;
  active_memory_namespace_layers?: string[];
  active_memory_namespace_selection_reason?: string | null;
  active_memory_namespace_policy_bundle_id?: string | null;
  active_memory_namespace_policy_digest_id?: string | null;
  active_memory_namespace_governance_convergence_digest_id?: string | null;
  active_memory_namespace_unified_governance_runtime_digest_id?: string | null;
  active_memory_namespace_policy_coordination_summary?: string | null;
  active_memory_namespace_governance_consistency_mode?: string | null;
  active_memory_namespace_route_governance_mode?: string | null;
  active_memory_retrieval_fallback_mode?: string | null;
  active_memory_write_escalation_mode?: string | null;
  active_memory_namespace_governance_convergence_summary?: string | null;
  active_memory_namespace_unified_governance_runtime_summary?: string | null;
  active_memory_namespace_unified_runtime_alignment_mode?: string | null;
  active_memory_namespace_unified_runtime_reuse_mode?: string | null;
  active_memory_namespace_governance_consolidation_digest_id?: string | null;
  active_memory_namespace_governance_consolidation_summary?: string | null;
  active_memory_namespace_runtime_consolidation_mode?: string | null;
  active_memory_namespace_unified_governance_consolidation_digest_id?: string | null;
  active_memory_namespace_unified_governance_consolidation_summary?: string | null;
  active_memory_namespace_unified_consolidation_alignment_mode?: string | null;
  active_memory_namespace_unified_consolidation_reuse_mode?: string | null;
  active_memory_namespace_unified_consolidation_coordination_summary?: string | null;
  active_memory_namespace_unified_consolidation_consistency_mode?: string | null;
  active_memory_namespace_governance_plane_runtime_digest_id?: string | null;
  active_memory_namespace_governance_plane_runtime_summary?: string | null;
  active_memory_namespace_governance_plane_alignment_mode?: string | null;
  active_memory_namespace_governance_plane_reuse_mode?: string | null;
  active_memory_namespace_governance_fabric_runtime_digest_id?: string | null;
  active_memory_namespace_governance_fabric_runtime_summary?: string | null;
  active_memory_namespace_governance_fabric_alignment_mode?: string | null;
  active_memory_namespace_governance_fabric_reuse_mode?: string | null;
  active_memory_namespace_governance_fabric_plane_digest_id?: string | null;
  active_memory_namespace_governance_fabric_plane_summary?: string | null;
  active_memory_namespace_governance_fabric_plane_alignment_mode?: string | null;
  active_memory_namespace_governance_fabric_plane_reuse_mode?: string | null;
  active_memory_namespace_retrieval_write_digest_alignment?: string | null;
  compacted_thread_summary_id?: string | null;
  compacted_thread_summary_text?: string | null;
  compacted_thread_summary_lifecycle_status?: string | null;
  compacted_thread_summary_continuity_status?: string | null;
  compacted_thread_retention_mode?: string | null;
  compacted_thread_retention_reason?: string | null;
  compacted_thread_retention_policy_id?: string | null;
  compacted_thread_cross_layer_survival_mode?: string | null;
  compacted_thread_retention_decision_group?: string | null;
  compacted_thread_survival_rationale?: string | null;
  compacted_thread_lifecycle_governance_digest?: string | null;
  compacted_thread_keep_drop_governance_summary?: string | null;
  compacted_thread_lifecycle_coordination_summary?: string | null;
  compacted_thread_survival_consistency_mode?: string | null;
  compacted_thread_lifecycle_convergence_digest?: string | null;
  compacted_thread_keep_drop_convergence_summary?: string | null;
  compacted_thread_lifecycle_alignment_mode?: string | null;
  compacted_thread_lifecycle_unification_digest?: string | null;
  compacted_thread_keep_drop_unification_summary?: string | null;
  compacted_thread_lifecycle_unification_mode?: string | null;
  compacted_thread_lifecycle_consolidation_digest?: string | null;
  compacted_thread_keep_drop_consolidation_summary?: string | null;
  compacted_thread_lifecycle_consolidation_mode?: string | null;
  compacted_thread_lifecycle_coordination_digest?: string | null;
  compacted_thread_keep_drop_consolidation_coordination_summary?: string | null;
  compacted_thread_lifecycle_coordination_alignment_mode?: string | null;
  compacted_thread_keep_drop_runtime_coordination_summary?: string | null;
  compacted_thread_lifecycle_coordination_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_plane_digest?: string | null;
  compacted_thread_keep_drop_governance_plane_summary?: string | null;
  compacted_thread_lifecycle_governance_plane_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_plane_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_digest?: string | null;
  compacted_thread_keep_drop_governance_fabric_summary?: string | null;
  compacted_thread_lifecycle_governance_fabric_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_reuse_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_digest?: string | null;
  compacted_thread_keep_drop_governance_fabric_plane_summary?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_alignment_mode?: string | null;
  compacted_thread_lifecycle_governance_fabric_plane_reuse_mode?: string | null;
  compacted_thread_retained_fields?: string[];
  hidden_memory_exclusion_count: number;
  incorrect_memory_exclusion_count: number;
  follow_up_request_count: number;
};

export function buildAssistantMetadataSummaryGroups(
  input: BuildAssistantMetadataSummaryGroupsInput
) {
  return {
    model_profile: {
      id: input.model_profile_id,
      name: input.model_profile_name,
      tier_label: input.model_profile_tier_label,
      usage_note: input.model_profile_usage_note
    },
    language: {
      target: input.reply_language_target,
      detected: input.reply_language_detected,
      source: input.reply_language_source
    },
    answer_strategy_details: {
      selected: input.answer_strategy,
      reason_code: input.answer_strategy_reason_code,
      priority: input.answer_strategy_priority,
      priority_label: input.answer_strategy_priority_label,
      question_type: input.question_type
    },
    session: {
      continuation_reason_code: input.continuation_reason_code,
      thread_state:
        input.thread_state_lifecycle_status ||
        input.thread_state_focus_mode ||
        input.thread_state_continuity_status ||
        input.thread_state_current_language_hint
          ? {
              lifecycle_status: input.thread_state_lifecycle_status ?? null,
              focus_mode: input.thread_state_focus_mode ?? null,
              continuity_status: input.thread_state_continuity_status ?? null,
              current_language_hint:
                input.thread_state_current_language_hint ?? null
            }
          : null,
      recent_turn_count: input.recent_raw_turn_count,
      context_pressure: input.approx_context_pressure
    },
    memory: {
      hit_count: input.memory_hit_count,
      used: input.memory_used,
      types_used: input.memory_types_used,
      profile_snapshot: input.profile_snapshot,
      pack: input.scenario_memory_pack_id
        ? {
            pack_id: input.scenario_memory_pack_id,
            label: input.scenario_memory_pack_label ?? null,
            preferred_routes: input.scenario_memory_pack_preferred_routes ?? [],
            assembly_order: input.scenario_memory_pack_assembly_order ?? [],
            selection_reason: input.scenario_memory_pack_selection_reason ?? null,
            knowledge_priority_layer:
              input.scenario_memory_pack_knowledge_priority_layer ?? null,
            assembly_emphasis:
              input.scenario_memory_pack_assembly_emphasis ?? null,
            knowledge_route_weight:
              input.scenario_memory_pack_knowledge_route_weight ?? null,
            knowledge_budget_weight:
              input.scenario_memory_pack_knowledge_budget_weight ?? null,
            route_influence_reason:
              input.scenario_memory_pack_route_influence_reason ?? null,
            governance_route_bias:
              input.scenario_memory_pack_governance_route_bias ?? null,
            strategy_policy_id:
              input.scenario_memory_pack_strategy_policy_id ?? null,
            orchestration_mode:
              input.scenario_memory_pack_orchestration_mode ?? null,
            orchestration_digest_id:
              input.scenario_memory_pack_orchestration_digest_id ?? null,
            strategy_rationale_summary:
              input.scenario_memory_pack_strategy_rationale_summary ?? null,
            orchestration_coordination_summary:
              input.scenario_memory_pack_orchestration_coordination_summary ??
              null,
            strategy_consistency_mode:
              input.scenario_memory_pack_strategy_consistency_mode ?? null,
            governance_convergence_digest_id:
              input.scenario_memory_pack_governance_convergence_digest_id ??
              null,
            strategy_convergence_summary:
              input.scenario_memory_pack_strategy_convergence_summary ?? null,
            orchestration_alignment_mode:
              input.scenario_memory_pack_orchestration_alignment_mode ?? null,
          governance_unification_digest_id:
            input.scenario_memory_pack_governance_unification_digest_id ??
            null,
          strategy_unification_summary:
            input.scenario_memory_pack_strategy_unification_summary ?? null,
          orchestration_unification_mode:
            input.scenario_memory_pack_orchestration_unification_mode ?? null,
          governance_consolidation_digest_id:
            input.scenario_memory_pack_governance_consolidation_digest_id ??
            null,
          strategy_consolidation_summary:
            input.scenario_memory_pack_strategy_consolidation_summary ?? null,
          orchestration_consolidation_mode:
            input.scenario_memory_pack_orchestration_consolidation_mode ?? null,
          governance_coordination_digest_id:
            input.scenario_memory_pack_governance_coordination_digest_id ??
            null,
          strategy_runtime_coordination_summary:
            input.scenario_memory_pack_strategy_runtime_coordination_summary ??
            null,
          orchestration_coordination_mode_v9:
            input.scenario_memory_pack_orchestration_coordination_mode_v9 ??
            null,
          strategy_runtime_reuse_summary:
            input.scenario_memory_pack_strategy_runtime_reuse_summary ?? null,
          governance_coordination_reuse_mode:
            input.scenario_memory_pack_governance_coordination_reuse_mode ??
            null,
          governance_plane_digest_id:
            input.scenario_memory_pack_governance_plane_digest_id ?? null,
          strategy_governance_plane_summary:
            input.scenario_memory_pack_strategy_governance_plane_summary ??
            null,
          orchestration_governance_plane_mode:
            input
              .scenario_memory_pack_orchestration_governance_plane_mode ??
            null,
          governance_plane_reuse_mode:
            input.scenario_memory_pack_governance_plane_reuse_mode ?? null,
          governance_fabric_digest_id:
            input.scenario_memory_pack_governance_fabric_digest_id ?? null,
          strategy_governance_fabric_summary:
            input.scenario_memory_pack_strategy_governance_fabric_summary ??
            null,
          orchestration_governance_fabric_mode:
            input
              .scenario_memory_pack_orchestration_governance_fabric_mode ??
            null,
          governance_fabric_reuse_mode:
            input.scenario_memory_pack_governance_fabric_reuse_mode ?? null,
          governance_fabric_plane_digest_id:
            input.scenario_memory_pack_governance_fabric_plane_digest_id ??
            null,
          strategy_governance_fabric_plane_summary:
            input
              .scenario_memory_pack_strategy_governance_fabric_plane_summary ??
            null,
          orchestration_governance_fabric_plane_mode:
            input
              .scenario_memory_pack_orchestration_governance_fabric_plane_mode ??
            null,
          governance_fabric_plane_reuse_mode:
            input.scenario_memory_pack_governance_fabric_plane_reuse_mode ??
            null,
          strategy_bundle_id:
            input.scenario_memory_pack_strategy_bundle_id ?? null,
            strategy_assembly_order:
              input.scenario_memory_pack_strategy_assembly_order ?? []
          }
        : null,
      semantic_summary: buildRuntimeMemorySemanticSummary({
        memoryTypesUsed: input.memory_types_used,
        profileSnapshot: input.profile_snapshot,
        hasThreadState:
          Boolean(input.thread_state_lifecycle_status) ||
          Boolean(input.thread_state_focus_mode) ||
          Boolean(input.thread_state_continuity_status) ||
          Boolean(input.thread_state_current_language_hint),
        threadStateFocusMode: input.thread_state_focus_mode ?? null,
        semanticLayersUsed: input.memory_semantic_layers
      }),
      hidden_exclusion_count: input.hidden_memory_exclusion_count,
      incorrect_exclusion_count: input.incorrect_memory_exclusion_count
    },
    knowledge: {
      count: input.knowledge_count ?? 0,
      titles: input.knowledge_titles ?? [],
      source_kinds: input.knowledge_source_kinds ?? [],
      scope_layers: input.knowledge_scope_layers ?? [],
      governance_classes: input.knowledge_governance_classes ?? [],
      governance_coordination_summary:
        input.knowledge_governance_coordination_summary ?? null,
      budget_coordination_mode:
        input.knowledge_budget_coordination_mode ?? null,
      source_governance_summary:
        input.knowledge_source_governance_summary ?? null,
      governance_consistency_mode:
        input.knowledge_governance_consistency_mode ?? null,
      governance_convergence_digest:
        input.knowledge_governance_convergence_digest ?? null,
      source_budget_alignment_summary:
        input.knowledge_source_budget_alignment_summary ?? null,
      governance_alignment_mode:
        input.knowledge_governance_alignment_mode ?? null,
      governance_unification_digest:
        input.knowledge_governance_unification_digest ?? null,
      source_budget_unification_summary:
        input.knowledge_source_budget_unification_summary ?? null,
      governance_unification_mode:
        input.knowledge_governance_unification_mode ?? null,
      governance_consolidation_digest:
        input.knowledge_governance_consolidation_digest ?? null,
      source_budget_consolidation_summary:
        input.knowledge_source_budget_consolidation_summary ?? null,
      governance_consolidation_mode:
        input.knowledge_governance_consolidation_mode ?? null,
      governance_coordination_digest:
        input.knowledge_governance_coordination_digest ?? null,
      source_budget_coordination_summary:
        input.knowledge_source_budget_coordination_summary ?? null,
      governance_coordination_mode_v9:
        input.knowledge_governance_coordination_mode_v9 ?? null,
      selection_runtime_coordination_summary:
        input.knowledge_selection_runtime_coordination_summary ?? null,
      governance_coordination_reuse_mode:
        input.knowledge_governance_coordination_reuse_mode ?? null,
      governance_plane_digest:
        input.knowledge_governance_plane_digest ?? null,
      source_budget_governance_plane_summary:
        input.knowledge_source_budget_governance_plane_summary ?? null,
      governance_plane_mode:
        input.knowledge_governance_plane_mode ?? null,
      governance_plane_reuse_mode:
        input.knowledge_governance_plane_reuse_mode ?? null,
      governance_fabric_digest:
        input.knowledge_governance_fabric_digest ?? null,
      source_budget_governance_fabric_summary:
        input.knowledge_source_budget_governance_fabric_summary ?? null,
      governance_fabric_mode:
        input.knowledge_governance_fabric_mode ?? null,
      governance_fabric_reuse_mode:
        input.knowledge_governance_fabric_reuse_mode ?? null,
      governance_fabric_plane_digest:
        input.knowledge_governance_fabric_plane_digest ?? null,
      source_budget_governance_fabric_plane_summary:
        input.knowledge_source_budget_governance_fabric_plane_summary ?? null,
      governance_fabric_plane_mode:
        input.knowledge_governance_fabric_plane_mode ?? null,
      governance_fabric_plane_reuse_mode:
        input.knowledge_governance_fabric_plane_reuse_mode ?? null
    },
    memory_namespace: input.active_memory_namespace_id
      ? {
          namespace_id: input.active_memory_namespace_id,
          primary_layer: input.active_memory_namespace_primary_layer ?? null,
          active_layers: input.active_memory_namespace_layers ?? [],
          selection_reason:
            input.active_memory_namespace_selection_reason ?? null,
          policy_bundle_id:
            input.active_memory_namespace_policy_bundle_id ?? null,
          policy_digest_id:
            input.active_memory_namespace_policy_digest_id ?? null,
          governance_convergence_digest_id:
            input.active_memory_namespace_governance_convergence_digest_id ??
            null,
          unified_governance_runtime_digest_id:
            input.active_memory_namespace_unified_governance_runtime_digest_id ??
            null,
          policy_coordination_summary:
            input.active_memory_namespace_policy_coordination_summary ?? null,
          governance_consistency_mode:
            input.active_memory_namespace_governance_consistency_mode ?? null,
          route_governance_mode:
            input.active_memory_namespace_route_governance_mode ?? null,
          retrieval_fallback_mode:
            input.active_memory_retrieval_fallback_mode ?? null,
          write_escalation_mode:
            input.active_memory_write_escalation_mode ?? null,
          governance_convergence_summary:
            input.active_memory_namespace_governance_convergence_summary ??
            null,
          unified_governance_runtime_summary:
            input.active_memory_namespace_unified_governance_runtime_summary ??
            null,
          unified_runtime_alignment_mode:
            input.active_memory_namespace_unified_runtime_alignment_mode ?? null,
          unified_runtime_reuse_mode:
            input.active_memory_namespace_unified_runtime_reuse_mode ?? null,
          governance_consolidation_digest_id:
            input.active_memory_namespace_governance_consolidation_digest_id ??
            null,
          governance_consolidation_summary:
            input.active_memory_namespace_governance_consolidation_summary ??
            null,
          runtime_consolidation_mode:
            input.active_memory_namespace_runtime_consolidation_mode ?? null,
          unified_governance_consolidation_digest_id:
            input.active_memory_namespace_unified_governance_consolidation_digest_id ??
            null,
          unified_governance_consolidation_summary:
            input.active_memory_namespace_unified_governance_consolidation_summary ??
            null,
          unified_consolidation_alignment_mode:
            input.active_memory_namespace_unified_consolidation_alignment_mode ??
            null,
          unified_consolidation_reuse_mode:
            input.active_memory_namespace_unified_consolidation_reuse_mode ??
            null,
          unified_consolidation_coordination_summary:
            input.active_memory_namespace_unified_consolidation_coordination_summary ??
            null,
          unified_consolidation_consistency_mode:
            input.active_memory_namespace_unified_consolidation_consistency_mode ??
            null,
          governance_plane_runtime_digest_id:
            input.active_memory_namespace_governance_plane_runtime_digest_id ??
            null,
          governance_plane_runtime_summary:
            input.active_memory_namespace_governance_plane_runtime_summary ??
            null,
          governance_plane_alignment_mode:
            input.active_memory_namespace_governance_plane_alignment_mode ??
            null,
          governance_plane_reuse_mode:
            input.active_memory_namespace_governance_plane_reuse_mode ?? null,
          governance_fabric_runtime_digest_id:
            input.active_memory_namespace_governance_fabric_runtime_digest_id ??
            null,
          governance_fabric_runtime_summary:
            input.active_memory_namespace_governance_fabric_runtime_summary ??
            null,
          governance_fabric_alignment_mode:
            input.active_memory_namespace_governance_fabric_alignment_mode ??
            null,
          governance_fabric_reuse_mode:
            input.active_memory_namespace_governance_fabric_reuse_mode ?? null,
          governance_fabric_plane_digest_id:
            input.active_memory_namespace_governance_fabric_plane_digest_id ??
            null,
          governance_fabric_plane_summary:
            input.active_memory_namespace_governance_fabric_plane_summary ??
            null,
          governance_fabric_plane_alignment_mode:
            input.active_memory_namespace_governance_fabric_plane_alignment_mode ??
            null,
          governance_fabric_plane_reuse_mode:
            input.active_memory_namespace_governance_fabric_plane_reuse_mode ??
            null,
          retrieval_write_digest_alignment:
            input.active_memory_namespace_retrieval_write_digest_alignment ??
            null
        }
      : null,
    thread_compaction: input.compacted_thread_summary_id
      ? {
          summary_id: input.compacted_thread_summary_id,
          summary_text: input.compacted_thread_summary_text ?? null,
          lifecycle_status:
            input.compacted_thread_summary_lifecycle_status ?? null,
          continuity_status:
            input.compacted_thread_summary_continuity_status ?? null,
          retention_mode:
            input.compacted_thread_retention_mode ?? null,
          retention_reason:
            input.compacted_thread_retention_reason ?? null,
          retention_policy_id:
            input.compacted_thread_retention_policy_id ?? null,
          cross_layer_survival_mode:
            input.compacted_thread_cross_layer_survival_mode ?? null,
          retention_decision_group:
            input.compacted_thread_retention_decision_group ?? null,
          survival_rationale:
            input.compacted_thread_survival_rationale ?? null,
          lifecycle_governance_digest:
            input.compacted_thread_lifecycle_governance_digest ?? null,
          keep_drop_governance_summary:
            input.compacted_thread_keep_drop_governance_summary ?? null,
          lifecycle_coordination_summary:
            input.compacted_thread_lifecycle_coordination_summary ?? null,
          survival_consistency_mode:
            input.compacted_thread_survival_consistency_mode ?? null,
          lifecycle_convergence_digest:
            input.compacted_thread_lifecycle_convergence_digest ?? null,
          keep_drop_convergence_summary:
            input.compacted_thread_keep_drop_convergence_summary ?? null,
          lifecycle_alignment_mode:
            input.compacted_thread_lifecycle_alignment_mode ?? null,
          lifecycle_unification_digest:
            input.compacted_thread_lifecycle_unification_digest ?? null,
          keep_drop_unification_summary:
            input.compacted_thread_keep_drop_unification_summary ?? null,
          lifecycle_unification_mode:
            input.compacted_thread_lifecycle_unification_mode ?? null,
          lifecycle_consolidation_digest:
            input.compacted_thread_lifecycle_consolidation_digest ?? null,
          keep_drop_consolidation_summary:
            input.compacted_thread_keep_drop_consolidation_summary ?? null,
          lifecycle_consolidation_mode:
            input.compacted_thread_lifecycle_consolidation_mode ?? null,
          lifecycle_coordination_digest:
            input.compacted_thread_lifecycle_coordination_digest ?? null,
          keep_drop_consolidation_coordination_summary:
            input
              .compacted_thread_keep_drop_consolidation_coordination_summary ??
            null,
          lifecycle_coordination_alignment_mode:
            input.compacted_thread_lifecycle_coordination_alignment_mode ??
            null,
          keep_drop_runtime_coordination_summary:
            input.compacted_thread_keep_drop_runtime_coordination_summary ??
            null,
          lifecycle_coordination_reuse_mode:
            input.compacted_thread_lifecycle_coordination_reuse_mode ?? null,
          lifecycle_governance_plane_digest:
            input.compacted_thread_lifecycle_governance_plane_digest ?? null,
          keep_drop_governance_plane_summary:
            input.compacted_thread_keep_drop_governance_plane_summary ?? null,
          lifecycle_governance_plane_alignment_mode:
            input.compacted_thread_lifecycle_governance_plane_alignment_mode ??
            null,
          lifecycle_governance_plane_reuse_mode:
            input.compacted_thread_lifecycle_governance_plane_reuse_mode ??
            null,
          lifecycle_governance_fabric_digest:
            input.compacted_thread_lifecycle_governance_fabric_digest ?? null,
          keep_drop_governance_fabric_summary:
            input.compacted_thread_keep_drop_governance_fabric_summary ?? null,
          lifecycle_governance_fabric_alignment_mode:
            input.compacted_thread_lifecycle_governance_fabric_alignment_mode ??
            null,
          lifecycle_governance_fabric_reuse_mode:
            input.compacted_thread_lifecycle_governance_fabric_reuse_mode ??
            null,
          lifecycle_governance_fabric_plane_digest:
            input.compacted_thread_lifecycle_governance_fabric_plane_digest ??
            null,
          keep_drop_governance_fabric_plane_summary:
            input.compacted_thread_keep_drop_governance_fabric_plane_summary ??
            null,
          lifecycle_governance_fabric_plane_alignment_mode:
            input.compacted_thread_lifecycle_governance_fabric_plane_alignment_mode ??
            null,
          lifecycle_governance_fabric_plane_reuse_mode:
            input.compacted_thread_lifecycle_governance_fabric_plane_reuse_mode ??
            null,
          retained_fields:
            input.compacted_thread_retained_fields ?? []
        }
      : null,
    follow_up: {
      request_count: input.follow_up_request_count
    },
    user_explanation: {
      underlying_model_label: input.underlying_model_label,
      model_profile_name: input.model_profile_name,
      model_profile_tier_label: input.model_profile_tier_label,
      model_profile_usage_note: input.model_profile_usage_note,
      memory_hit_count: input.memory_hit_count,
      memory_used: input.memory_used,
      memory_types_used: input.memory_types_used,
      memory_semantic_layers: input.memory_semantic_layers,
      profile_snapshot: input.profile_snapshot,
      scenario_memory_pack_id: input.scenario_memory_pack_id,
      scenario_memory_pack_label: input.scenario_memory_pack_label,
      scenario_memory_pack_preferred_routes:
        input.scenario_memory_pack_preferred_routes,
      scenario_memory_pack_assembly_order:
        input.scenario_memory_pack_assembly_order,
      scenario_memory_pack_selection_reason:
        input.scenario_memory_pack_selection_reason,
      scenario_memory_pack_knowledge_priority_layer:
        input.scenario_memory_pack_knowledge_priority_layer,
      scenario_memory_pack_assembly_emphasis:
        input.scenario_memory_pack_assembly_emphasis,
      scenario_memory_pack_knowledge_route_weight:
        input.scenario_memory_pack_knowledge_route_weight,
      scenario_memory_pack_knowledge_budget_weight:
        input.scenario_memory_pack_knowledge_budget_weight,
      scenario_memory_pack_route_influence_reason:
        input.scenario_memory_pack_route_influence_reason,
      scenario_memory_pack_governance_route_bias:
        input.scenario_memory_pack_governance_route_bias,
      scenario_memory_pack_strategy_policy_id:
        input.scenario_memory_pack_strategy_policy_id,
      scenario_memory_pack_orchestration_mode:
        input.scenario_memory_pack_orchestration_mode,
      scenario_memory_pack_orchestration_digest_id:
        input.scenario_memory_pack_orchestration_digest_id,
      scenario_memory_pack_strategy_rationale_summary:
        input.scenario_memory_pack_strategy_rationale_summary,
      scenario_memory_pack_orchestration_coordination_summary:
        input.scenario_memory_pack_orchestration_coordination_summary,
      scenario_memory_pack_strategy_consistency_mode:
        input.scenario_memory_pack_strategy_consistency_mode,
      scenario_memory_pack_governance_convergence_digest_id:
        input.scenario_memory_pack_governance_convergence_digest_id,
      scenario_memory_pack_strategy_convergence_summary:
        input.scenario_memory_pack_strategy_convergence_summary,
      scenario_memory_pack_orchestration_alignment_mode:
        input.scenario_memory_pack_orchestration_alignment_mode,
      scenario_memory_pack_governance_unification_digest_id:
        input.scenario_memory_pack_governance_unification_digest_id,
      scenario_memory_pack_strategy_unification_summary:
        input.scenario_memory_pack_strategy_unification_summary,
      scenario_memory_pack_orchestration_unification_mode:
        input.scenario_memory_pack_orchestration_unification_mode,
      scenario_memory_pack_governance_consolidation_digest_id:
        input.scenario_memory_pack_governance_consolidation_digest_id,
      scenario_memory_pack_strategy_consolidation_summary:
        input.scenario_memory_pack_strategy_consolidation_summary,
      scenario_memory_pack_orchestration_consolidation_mode:
        input.scenario_memory_pack_orchestration_consolidation_mode,
      scenario_memory_pack_governance_coordination_digest_id:
        input.scenario_memory_pack_governance_coordination_digest_id,
      scenario_memory_pack_strategy_runtime_coordination_summary:
        input.scenario_memory_pack_strategy_runtime_coordination_summary,
      scenario_memory_pack_orchestration_coordination_mode_v9:
        input.scenario_memory_pack_orchestration_coordination_mode_v9,
      scenario_memory_pack_strategy_runtime_reuse_summary:
        input.scenario_memory_pack_strategy_runtime_reuse_summary,
      scenario_memory_pack_governance_coordination_reuse_mode:
        input.scenario_memory_pack_governance_coordination_reuse_mode,
      scenario_memory_pack_governance_plane_digest_id:
        input.scenario_memory_pack_governance_plane_digest_id,
      scenario_memory_pack_strategy_governance_plane_summary:
        input.scenario_memory_pack_strategy_governance_plane_summary,
      scenario_memory_pack_orchestration_governance_plane_mode:
        input.scenario_memory_pack_orchestration_governance_plane_mode,
      scenario_memory_pack_governance_plane_reuse_mode:
        input.scenario_memory_pack_governance_plane_reuse_mode,
      scenario_memory_pack_governance_fabric_digest_id:
        input.scenario_memory_pack_governance_fabric_digest_id,
      scenario_memory_pack_strategy_governance_fabric_summary:
        input.scenario_memory_pack_strategy_governance_fabric_summary,
      scenario_memory_pack_orchestration_governance_fabric_mode:
        input.scenario_memory_pack_orchestration_governance_fabric_mode,
      scenario_memory_pack_governance_fabric_reuse_mode:
        input.scenario_memory_pack_governance_fabric_reuse_mode,
      scenario_memory_pack_governance_fabric_plane_digest_id:
        input.scenario_memory_pack_governance_fabric_plane_digest_id,
      scenario_memory_pack_strategy_governance_fabric_plane_summary:
        input.scenario_memory_pack_strategy_governance_fabric_plane_summary,
      scenario_memory_pack_orchestration_governance_fabric_plane_mode:
        input.scenario_memory_pack_orchestration_governance_fabric_plane_mode,
      scenario_memory_pack_governance_fabric_plane_reuse_mode:
        input.scenario_memory_pack_governance_fabric_plane_reuse_mode,
      scenario_memory_pack_strategy_bundle_id:
        input.scenario_memory_pack_strategy_bundle_id,
      scenario_memory_pack_strategy_assembly_order:
        input.scenario_memory_pack_strategy_assembly_order,
      knowledge_count: input.knowledge_count,
      knowledge_titles: input.knowledge_titles,
      knowledge_source_kinds: input.knowledge_source_kinds,
      knowledge_scope_layers: input.knowledge_scope_layers,
      knowledge_governance_classes: input.knowledge_governance_classes,
      knowledge_governance_coordination_summary:
        input.knowledge_governance_coordination_summary,
      knowledge_budget_coordination_mode:
        input.knowledge_budget_coordination_mode,
      knowledge_source_governance_summary:
        input.knowledge_source_governance_summary,
      knowledge_governance_consistency_mode:
        input.knowledge_governance_consistency_mode,
      knowledge_governance_convergence_digest:
        input.knowledge_governance_convergence_digest,
      knowledge_source_budget_alignment_summary:
        input.knowledge_source_budget_alignment_summary,
      knowledge_governance_alignment_mode:
        input.knowledge_governance_alignment_mode,
      knowledge_governance_unification_digest:
        input.knowledge_governance_unification_digest,
      knowledge_source_budget_unification_summary:
        input.knowledge_source_budget_unification_summary,
      knowledge_governance_unification_mode:
        input.knowledge_governance_unification_mode,
      knowledge_governance_consolidation_digest:
        input.knowledge_governance_consolidation_digest,
      knowledge_source_budget_consolidation_summary:
        input.knowledge_source_budget_consolidation_summary,
      knowledge_governance_consolidation_mode:
        input.knowledge_governance_consolidation_mode,
      knowledge_governance_coordination_digest:
        input.knowledge_governance_coordination_digest,
      knowledge_source_budget_coordination_summary:
        input.knowledge_source_budget_coordination_summary,
      knowledge_governance_coordination_mode_v9:
        input.knowledge_governance_coordination_mode_v9,
      knowledge_selection_runtime_coordination_summary:
        input.knowledge_selection_runtime_coordination_summary,
      knowledge_governance_coordination_reuse_mode:
        input.knowledge_governance_coordination_reuse_mode,
      knowledge_governance_plane_digest:
        input.knowledge_governance_plane_digest,
      knowledge_source_budget_governance_plane_summary:
        input.knowledge_source_budget_governance_plane_summary,
      knowledge_governance_plane_mode:
        input.knowledge_governance_plane_mode,
      knowledge_governance_plane_reuse_mode:
        input.knowledge_governance_plane_reuse_mode,
      knowledge_governance_fabric_digest:
        input.knowledge_governance_fabric_digest,
      knowledge_source_budget_governance_fabric_summary:
        input.knowledge_source_budget_governance_fabric_summary,
      knowledge_governance_fabric_mode:
        input.knowledge_governance_fabric_mode,
      knowledge_governance_fabric_reuse_mode:
        input.knowledge_governance_fabric_reuse_mode,
      knowledge_governance_fabric_plane_digest:
        input.knowledge_governance_fabric_plane_digest,
      knowledge_source_budget_governance_fabric_plane_summary:
        input.knowledge_source_budget_governance_fabric_plane_summary,
      knowledge_governance_fabric_plane_mode:
        input.knowledge_governance_fabric_plane_mode,
      knowledge_governance_fabric_plane_reuse_mode:
        input.knowledge_governance_fabric_plane_reuse_mode,
      active_memory_namespace_id: input.active_memory_namespace_id,
      active_memory_namespace_primary_layer:
        input.active_memory_namespace_primary_layer,
      active_memory_namespace_layers: input.active_memory_namespace_layers,
      active_memory_namespace_selection_reason:
        input.active_memory_namespace_selection_reason,
      active_memory_namespace_policy_bundle_id:
        input.active_memory_namespace_policy_bundle_id,
      active_memory_namespace_policy_digest_id:
        input.active_memory_namespace_policy_digest_id,
      active_memory_namespace_governance_convergence_digest_id:
        input.active_memory_namespace_governance_convergence_digest_id,
      active_memory_namespace_unified_governance_runtime_digest_id:
        input.active_memory_namespace_unified_governance_runtime_digest_id,
      active_memory_namespace_policy_coordination_summary:
        input.active_memory_namespace_policy_coordination_summary,
      active_memory_namespace_governance_consistency_mode:
        input.active_memory_namespace_governance_consistency_mode,
      active_memory_namespace_route_governance_mode:
        input.active_memory_namespace_route_governance_mode,
      active_memory_retrieval_fallback_mode:
        input.active_memory_retrieval_fallback_mode,
      active_memory_write_escalation_mode:
        input.active_memory_write_escalation_mode,
      active_memory_namespace_governance_convergence_summary:
        input.active_memory_namespace_governance_convergence_summary,
      active_memory_namespace_unified_governance_runtime_summary:
        input.active_memory_namespace_unified_governance_runtime_summary,
      active_memory_namespace_unified_runtime_alignment_mode:
        input.active_memory_namespace_unified_runtime_alignment_mode,
      active_memory_namespace_unified_runtime_reuse_mode:
        input.active_memory_namespace_unified_runtime_reuse_mode,
      active_memory_namespace_governance_consolidation_digest_id:
        input.active_memory_namespace_governance_consolidation_digest_id,
      active_memory_namespace_governance_consolidation_summary:
        input.active_memory_namespace_governance_consolidation_summary,
      active_memory_namespace_runtime_consolidation_mode:
        input.active_memory_namespace_runtime_consolidation_mode,
      active_memory_namespace_unified_governance_consolidation_digest_id:
        input.active_memory_namespace_unified_governance_consolidation_digest_id,
      active_memory_namespace_unified_governance_consolidation_summary:
        input.active_memory_namespace_unified_governance_consolidation_summary,
      active_memory_namespace_unified_consolidation_alignment_mode:
        input.active_memory_namespace_unified_consolidation_alignment_mode,
      active_memory_namespace_unified_consolidation_reuse_mode:
        input.active_memory_namespace_unified_consolidation_reuse_mode,
      active_memory_namespace_unified_consolidation_coordination_summary:
        input.active_memory_namespace_unified_consolidation_coordination_summary,
      active_memory_namespace_unified_consolidation_consistency_mode:
        input.active_memory_namespace_unified_consolidation_consistency_mode,
      active_memory_namespace_governance_plane_runtime_digest_id:
        input.active_memory_namespace_governance_plane_runtime_digest_id,
      active_memory_namespace_governance_plane_runtime_summary:
        input.active_memory_namespace_governance_plane_runtime_summary,
      active_memory_namespace_governance_plane_alignment_mode:
        input.active_memory_namespace_governance_plane_alignment_mode,
      active_memory_namespace_governance_plane_reuse_mode:
        input.active_memory_namespace_governance_plane_reuse_mode,
      active_memory_namespace_governance_fabric_runtime_digest_id:
        input.active_memory_namespace_governance_fabric_runtime_digest_id,
      active_memory_namespace_governance_fabric_runtime_summary:
        input.active_memory_namespace_governance_fabric_runtime_summary,
      active_memory_namespace_governance_fabric_alignment_mode:
        input.active_memory_namespace_governance_fabric_alignment_mode,
      active_memory_namespace_governance_fabric_reuse_mode:
        input.active_memory_namespace_governance_fabric_reuse_mode,
      active_memory_namespace_governance_fabric_plane_digest_id:
        input.active_memory_namespace_governance_fabric_plane_digest_id,
      active_memory_namespace_governance_fabric_plane_summary:
        input.active_memory_namespace_governance_fabric_plane_summary,
      active_memory_namespace_governance_fabric_plane_alignment_mode:
        input.active_memory_namespace_governance_fabric_plane_alignment_mode,
      active_memory_namespace_governance_fabric_plane_reuse_mode:
        input.active_memory_namespace_governance_fabric_plane_reuse_mode,
      active_memory_namespace_retrieval_write_digest_alignment:
        input.active_memory_namespace_retrieval_write_digest_alignment,
      compacted_thread_summary_id: input.compacted_thread_summary_id,
      compacted_thread_summary_text: input.compacted_thread_summary_text,
      compacted_thread_summary_lifecycle_status:
        input.compacted_thread_summary_lifecycle_status,
      compacted_thread_summary_continuity_status:
        input.compacted_thread_summary_continuity_status,
      compacted_thread_retention_mode:
        input.compacted_thread_retention_mode,
      compacted_thread_retention_reason:
        input.compacted_thread_retention_reason,
      compacted_thread_retention_policy_id:
        input.compacted_thread_retention_policy_id,
      compacted_thread_cross_layer_survival_mode:
        input.compacted_thread_cross_layer_survival_mode,
      compacted_thread_retention_decision_group:
        input.compacted_thread_retention_decision_group,
      compacted_thread_survival_rationale:
        input.compacted_thread_survival_rationale,
      compacted_thread_lifecycle_governance_digest:
        input.compacted_thread_lifecycle_governance_digest,
      compacted_thread_keep_drop_governance_summary:
        input.compacted_thread_keep_drop_governance_summary,
      compacted_thread_lifecycle_coordination_summary:
        input.compacted_thread_lifecycle_coordination_summary,
      compacted_thread_survival_consistency_mode:
        input.compacted_thread_survival_consistency_mode,
      compacted_thread_lifecycle_convergence_digest:
        input.compacted_thread_lifecycle_convergence_digest,
      compacted_thread_keep_drop_convergence_summary:
        input.compacted_thread_keep_drop_convergence_summary,
      compacted_thread_lifecycle_alignment_mode:
        input.compacted_thread_lifecycle_alignment_mode,
      compacted_thread_lifecycle_unification_digest:
        input.compacted_thread_lifecycle_unification_digest,
      compacted_thread_keep_drop_unification_summary:
        input.compacted_thread_keep_drop_unification_summary,
      compacted_thread_lifecycle_unification_mode:
        input.compacted_thread_lifecycle_unification_mode,
      compacted_thread_lifecycle_consolidation_digest:
        input.compacted_thread_lifecycle_consolidation_digest,
      compacted_thread_keep_drop_consolidation_summary:
        input.compacted_thread_keep_drop_consolidation_summary,
      compacted_thread_lifecycle_consolidation_mode:
        input.compacted_thread_lifecycle_consolidation_mode,
      compacted_thread_lifecycle_coordination_digest:
        input.compacted_thread_lifecycle_coordination_digest,
      compacted_thread_keep_drop_consolidation_coordination_summary:
        input.compacted_thread_keep_drop_consolidation_coordination_summary,
      compacted_thread_lifecycle_coordination_alignment_mode:
        input.compacted_thread_lifecycle_coordination_alignment_mode,
      compacted_thread_keep_drop_runtime_coordination_summary:
        input.compacted_thread_keep_drop_runtime_coordination_summary,
      compacted_thread_lifecycle_coordination_reuse_mode:
        input.compacted_thread_lifecycle_coordination_reuse_mode,
      compacted_thread_lifecycle_governance_plane_digest:
        input.compacted_thread_lifecycle_governance_plane_digest,
      compacted_thread_keep_drop_governance_plane_summary:
        input.compacted_thread_keep_drop_governance_plane_summary,
      compacted_thread_lifecycle_governance_plane_alignment_mode:
        input.compacted_thread_lifecycle_governance_plane_alignment_mode,
      compacted_thread_lifecycle_governance_plane_reuse_mode:
        input.compacted_thread_lifecycle_governance_plane_reuse_mode,
      compacted_thread_lifecycle_governance_fabric_digest:
        input.compacted_thread_lifecycle_governance_fabric_digest,
      compacted_thread_keep_drop_governance_fabric_summary:
        input.compacted_thread_keep_drop_governance_fabric_summary,
      compacted_thread_lifecycle_governance_fabric_alignment_mode:
        input.compacted_thread_lifecycle_governance_fabric_alignment_mode,
      compacted_thread_lifecycle_governance_fabric_reuse_mode:
        input.compacted_thread_lifecycle_governance_fabric_reuse_mode,
      compacted_thread_lifecycle_governance_fabric_plane_digest:
        input.compacted_thread_lifecycle_governance_fabric_plane_digest,
      compacted_thread_keep_drop_governance_fabric_plane_summary:
        input.compacted_thread_keep_drop_governance_fabric_plane_summary,
      compacted_thread_lifecycle_governance_fabric_plane_alignment_mode:
        input.compacted_thread_lifecycle_governance_fabric_plane_alignment_mode,
      compacted_thread_lifecycle_governance_fabric_plane_reuse_mode:
        input.compacted_thread_lifecycle_governance_fabric_plane_reuse_mode,
      compacted_thread_retained_fields:
        input.compacted_thread_retained_fields,
      hidden_memory_exclusion_count: input.hidden_memory_exclusion_count,
      incorrect_memory_exclusion_count: input.incorrect_memory_exclusion_count
    }
  };
}

export function buildAssistantMessageMetadata(
  input: BuildAssistantMessageMetadataInput
): Record<string, unknown> {
  return {
    agent_id: input.agent_id,
    agent_name: input.agent_name,
    model: input.model,
    model_provider: input.model_provider,
    model_requested: input.model_requested,
    model_profile_id: input.model_profile_id,
    role_core_packet: input.role_core_packet,
    question_type: input.question_type,
    answer_strategy: input.answer_strategy,
    answer_strategy_reason_code: input.answer_strategy_reason_code,
    continuation_reason_code: input.continuation_reason_code,
    thread_state_lifecycle_status: input.thread_state_lifecycle_status,
    thread_state_focus_mode: input.thread_state_focus_mode,
    thread_state_continuity_status: input.thread_state_continuity_status,
    thread_state_current_language_hint: input.thread_state_current_language_hint,
    recent_raw_turn_count: input.recent_raw_turn_count,
    approx_context_pressure: input.approx_context_pressure,
    same_thread_continuation_applicable:
      input.same_thread_continuation_applicable,
    long_chain_pressure_candidate: input.long_chain_pressure_candidate,
    same_thread_continuation_preferred:
      input.same_thread_continuation_preferred,
    distant_memory_fallback_allowed: input.distant_memory_fallback_allowed,
    reply_language_target: input.reply_language_target,
    reply_language_detected: input.reply_language_detected,
    reply_language_source: input.reply_language_source,
    memory_hit_count: input.memory_hit_count,
    memory_used: input.memory_used,
    recalled_memories: input.recalled_memories,
    ...buildAssistantMetadataSummaryGroups(input),
    developer_diagnostics: {
      role_core_packet: input.role_core_packet,
      prepared_runtime_turn: {
        input: input.runtime_input,
        session: {
          thread_id: input.session_thread_id,
          agent_id: input.session_agent_id,
          current_message_id: input.current_message_id,
          recent_raw_turn_count: input.recent_raw_turn_count,
          approx_context_pressure: input.approx_context_pressure
        }
      },
      reply_language_target: input.reply_language_target,
      reply_language_detected: input.reply_language_detected,
      question_type: input.question_type,
      answer_strategy: input.answer_strategy,
      answer_strategy_reason_code: input.answer_strategy_reason_code,
      answer_strategy_priority: input.answer_strategy_priority,
      answer_strategy_priority_label: input.answer_strategy_priority_label,
      continuation_reason_code: input.continuation_reason_code,
      recent_raw_turn_count: input.recent_raw_turn_count,
      approx_context_pressure: input.approx_context_pressure,
      same_thread_continuation_applicable:
        input.same_thread_continuation_applicable,
      long_chain_pressure_candidate: input.long_chain_pressure_candidate,
      same_thread_continuation_preferred:
        input.same_thread_continuation_preferred,
      distant_memory_fallback_allowed: input.distant_memory_fallback_allowed,
      reply_language_source: input.reply_language_source,
      recalled_memories: input.recalled_memories
    }
  };
}
