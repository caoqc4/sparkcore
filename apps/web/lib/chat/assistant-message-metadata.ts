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
  knowledge_count?: number;
  knowledge_titles?: string[];
  knowledge_source_kinds?: string[];
  compacted_thread_summary_id?: string | null;
  compacted_thread_summary_text?: string | null;
  compacted_thread_summary_lifecycle_status?: string | null;
  compacted_thread_summary_continuity_status?: string | null;
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
  knowledge_count?: number;
  knowledge_titles?: string[];
  knowledge_source_kinds?: string[];
  compacted_thread_summary_id?: string | null;
  compacted_thread_summary_text?: string | null;
  compacted_thread_summary_lifecycle_status?: string | null;
  compacted_thread_summary_continuity_status?: string | null;
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
            selection_reason: input.scenario_memory_pack_selection_reason ?? null
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
      source_kinds: input.knowledge_source_kinds ?? []
    },
    thread_compaction: input.compacted_thread_summary_id
      ? {
          summary_id: input.compacted_thread_summary_id,
          summary_text: input.compacted_thread_summary_text ?? null,
          lifecycle_status:
            input.compacted_thread_summary_lifecycle_status ?? null,
          continuity_status:
            input.compacted_thread_summary_continuity_status ?? null
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
      knowledge_count: input.knowledge_count,
      knowledge_titles: input.knowledge_titles,
      knowledge_source_kinds: input.knowledge_source_kinds,
      compacted_thread_summary_id: input.compacted_thread_summary_id,
      compacted_thread_summary_text: input.compacted_thread_summary_text,
      compacted_thread_summary_lifecycle_status:
        input.compacted_thread_summary_lifecycle_status,
      compacted_thread_summary_continuity_status:
        input.compacted_thread_summary_continuity_status,
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
