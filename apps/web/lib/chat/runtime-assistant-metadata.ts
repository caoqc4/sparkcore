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
import type { ActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import {
  resolveKnowledgeScopeLayer,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
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
    scenario_memory_pack_route_influence_reason:
      input.memory.scenario_pack?.route_influence_reason ?? null,
    hidden_memory_exclusion_count: input.memory.hidden_exclusion_count,
    incorrect_memory_exclusion_count: input.memory.incorrect_exclusion_count,
    knowledge_count: input.knowledge.snippets.length,
    knowledge_titles: input.knowledge.snippets.map((item) => item.title),
    knowledge_source_kinds: Array.from(
      new Set(input.knowledge.snippets.map((item) => item.source_kind))
    ),
    knowledge_scope_layers: Array.from(
      new Set(input.knowledge.snippets.map((item) => resolveKnowledgeScopeLayer(item)))
    ),
    active_memory_namespace_id:
      input.namespace.active_namespace?.namespace_id ?? null,
    active_memory_namespace_primary_layer:
      input.namespace.active_namespace?.primary_layer ?? null,
    active_memory_namespace_layers:
      input.namespace.active_namespace?.active_layers ?? [],
    active_memory_namespace_selection_reason:
      input.namespace.active_namespace?.selection_reason ?? null,
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
    compacted_thread_retained_fields:
      input.compaction.summary?.retained_fields ?? [],
    follow_up_request_count: input.follow_up.request_count,
  };
}
