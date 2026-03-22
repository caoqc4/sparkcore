import type {
  LoadThreadStateInput,
  LoadThreadStateResult,
  ThreadContinuityStatus,
  ThreadLifecycleStatus,
  ThreadStateRecord
} from "@/lib/chat/thread-state";
import type { SessionReplyLanguage } from "@/lib/chat/session-context";
import type { ThreadStateRepository } from "@/lib/chat/thread-state-repository";

export const DEFAULT_THREAD_STATES_TABLE = "thread_states";

export type ThreadStateRow = {
  thread_id: string;
  agent_id: string;
  state_version: number;
  lifecycle_status: ThreadLifecycleStatus;
  focus_mode: string | null;
  current_language_hint: SessionReplyLanguage | null;
  recent_turn_window_size: number | null;
  continuity_status: ThreadContinuityStatus | null;
  last_user_message_id: string | null;
  last_assistant_message_id: string | null;
  updated_at: string;
};

export function mapThreadStateRowToRecord(
  row: ThreadStateRow
): ThreadStateRecord {
  return {
    thread_id: row.thread_id,
    agent_id: row.agent_id,
    state_version: row.state_version,
    lifecycle_status: row.lifecycle_status,
    focus_mode: row.focus_mode,
    current_language_hint: row.current_language_hint,
    recent_turn_window_size: row.recent_turn_window_size,
    continuity_status: row.continuity_status,
    last_user_message_id: row.last_user_message_id,
    last_assistant_message_id: row.last_assistant_message_id,
    updated_at: row.updated_at
  };
}

export class SupabaseThreadStateRepository implements ThreadStateRepository {
  constructor(
    private readonly supabase: any,
    private readonly tableName: string = DEFAULT_THREAD_STATES_TABLE
  ) {}

  async loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "thread_id, agent_id, state_version, lifecycle_status, focus_mode, current_language_hint, recent_turn_window_size, continuity_status, last_user_message_id, last_assistant_message_id, updated_at"
      )
      .eq("thread_id", input.threadId)
      .eq("agent_id", input.agentId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load thread state from ${this.tableName}: ${error.message}`
      );
    }

    if (!data) {
      return {
        status: "not_found"
      };
    }

    return {
      status: "found",
      thread_state: mapThreadStateRowToRecord(data as ThreadStateRow)
    };
  }
}
