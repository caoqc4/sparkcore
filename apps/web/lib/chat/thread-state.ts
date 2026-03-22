import type { SessionReplyLanguage } from "@/lib/chat/session-context";

export type ThreadLifecycleStatus = "active" | "paused" | "closed";

export type ThreadContinuityStatus = "cold" | "warm" | "engaged";

export type ThreadStateRecord = {
  thread_id: string;
  agent_id: string;
  state_version: number;
  lifecycle_status: ThreadLifecycleStatus;
  focus_mode?: string | null;
  current_language_hint?: SessionReplyLanguage | null;
  recent_turn_window_size?: number | null;
  continuity_status?: ThreadContinuityStatus | null;
  last_user_message_id?: string | null;
  last_assistant_message_id?: string | null;
  updated_at: string;
};

export function buildDefaultThreadState(args: {
  threadId: string;
  agentId: string;
  currentLanguageHint?: SessionReplyLanguage | null;
  lastUserMessageId?: string | null;
  lastAssistantMessageId?: string | null;
  continuityStatus?: ThreadContinuityStatus | null;
  lifecycleStatus?: ThreadLifecycleStatus;
  recentTurnWindowSize?: number | null;
  focusMode?: string | null;
  updatedAt?: string;
}): ThreadStateRecord {
  return {
    thread_id: args.threadId,
    agent_id: args.agentId,
    state_version: 1,
    lifecycle_status: args.lifecycleStatus ?? "active",
    focus_mode: args.focusMode ?? null,
    current_language_hint: args.currentLanguageHint ?? null,
    recent_turn_window_size: args.recentTurnWindowSize ?? null,
    continuity_status: args.continuityStatus ?? null,
    last_user_message_id: args.lastUserMessageId ?? null,
    last_assistant_message_id: args.lastAssistantMessageId ?? null,
    updated_at: args.updatedAt ?? new Date().toISOString()
  };
}
