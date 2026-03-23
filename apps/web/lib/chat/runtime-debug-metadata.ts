import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type { RuntimeThreadStateRecall } from "@/lib/chat/memory-recall";
import type { MemorySemanticLayer } from "@/lib/chat/memory-shared";
import { buildRuntimeMemorySemanticSummary } from "@/lib/chat/memory-records";
import type { ActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import { buildKnowledgeSummary } from "@/lib/chat/memory-knowledge";

export type BuildRuntimeDebugMetadataInput = {
  model_profile_id: string;
  answer_strategy: string;
  answer_strategy_reason_code: string | null;
  recalled_memory_count: number;
  memory_types_used: string[];
  memory_semantic_layers?: Array<MemorySemanticLayer | null | undefined>;
  memory_recall_routes: Array<"profile" | "episode" | "timeline" | "thread_state">;
  profile_snapshot: string[];
  memory_write_request_count: number;
  follow_up_request_count: number;
  continuation_reason_code: string | null;
  recent_turn_count: number;
  context_pressure: ApproxContextPressure;
  thread_state_recall?: RuntimeThreadStateRecall | null;
  reply_language: string;
  scenario_memory_pack?: ActiveScenarioMemoryPack | null;
  relevant_knowledge?: RuntimeKnowledgeSnippet[];
};

export function buildRuntimeDebugMetadata(
  input: BuildRuntimeDebugMetadataInput
) {
  return {
    model_profile_id: input.model_profile_id,
    answer_strategy: {
      selected: input.answer_strategy,
      reason_code: input.answer_strategy_reason_code
    },
    memory: {
      recalled_count: input.recalled_memory_count,
      types_used: input.memory_types_used,
      routes: input.memory_recall_routes,
      profile_snapshot: input.profile_snapshot,
      semantic_summary: buildRuntimeMemorySemanticSummary({
        memoryTypesUsed: input.memory_types_used,
        profileSnapshot: input.profile_snapshot,
        hasThreadState: Boolean(input.thread_state_recall?.applied),
        threadStateFocusMode: input.thread_state_recall?.snapshot?.focus_mode ?? null,
        semanticLayersUsed: input.memory_semantic_layers
      }),
      pack: input.scenario_memory_pack
        ? {
            pack_id: input.scenario_memory_pack.pack_id,
            label: input.scenario_memory_pack.label,
            preferred_routes: input.scenario_memory_pack.preferred_routes,
            assembly_order: input.scenario_memory_pack.assembly_order,
            selection_reason: input.scenario_memory_pack.selection_reason
          }
        : null,
      write_request_count: input.memory_write_request_count
    },
    knowledge: buildKnowledgeSummary({
      knowledge: input.relevant_knowledge ?? []
    }),
    follow_up: {
      request_count: input.follow_up_request_count
    },
    session: {
      continuation_reason_code: input.continuation_reason_code,
      recent_turn_count: input.recent_turn_count,
      context_pressure: input.context_pressure,
      thread_state:
        input.thread_state_recall?.applied && input.thread_state_recall.snapshot
          ? {
              lifecycle_status:
                input.thread_state_recall.snapshot.lifecycle_status,
              focus_mode: input.thread_state_recall.snapshot.focus_mode,
              continuity_status:
                input.thread_state_recall.snapshot.continuity_status,
              current_language_hint:
                input.thread_state_recall.snapshot.current_language_hint
            }
          : null
    },
    reply_language: input.reply_language
  };
}
