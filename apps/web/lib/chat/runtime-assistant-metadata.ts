import type {
  BuildAssistantMessageMetadataInput,
} from "@/lib/chat/assistant-message-metadata";
import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type {
  ReplyLanguageSource,
  RoleCorePacket,
  RuntimeReplyLanguage,
} from "@/lib/chat/role-core";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";

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
    hidden_exclusion_count: number;
    incorrect_exclusion_count: number;
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
    hidden_memory_exclusion_count: input.memory.hidden_exclusion_count,
    incorrect_memory_exclusion_count: input.memory.incorrect_exclusion_count,
    follow_up_request_count: input.follow_up.request_count,
  };
}
