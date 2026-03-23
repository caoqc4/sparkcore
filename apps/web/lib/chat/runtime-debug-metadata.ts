import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type { RuntimeThreadStateRecall } from "@/lib/chat/memory-recall";

export type BuildRuntimeDebugMetadataInput = {
  model_profile_id: string;
  answer_strategy: string;
  answer_strategy_reason_code: string | null;
  recalled_memory_count: number;
  memory_recall_routes: Array<"profile" | "episode" | "timeline" | "thread_state">;
  profile_snapshot: string[];
  memory_write_request_count: number;
  follow_up_request_count: number;
  continuation_reason_code: string | null;
  recent_turn_count: number;
  context_pressure: ApproxContextPressure;
  thread_state_recall?: RuntimeThreadStateRecall | null;
  reply_language: string;
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
      routes: input.memory_recall_routes,
      profile_snapshot: input.profile_snapshot,
      write_request_count: input.memory_write_request_count
    },
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
