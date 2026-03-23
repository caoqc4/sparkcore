export type CompactedThreadLifecycleStatus = "active" | "paused" | "closed";

export type CompactedThreadContinuityStatus = "cold" | "warm" | "engaged";

export type ThreadRetentionMode =
  | "focus_anchor"
  | "continuity_anchor"
  | "recent_window"
  | "minimal";

export type CompactedThreadSummary = {
  summary_id: string;
  thread_id: string;
  agent_id: string;
  lifecycle_status: CompactedThreadLifecycleStatus;
  continuity_status: CompactedThreadContinuityStatus | null;
  focus_mode: string | null;
  current_language_hint: string | null;
  retention_mode: ThreadRetentionMode;
  retained_fields: string[];
  summary_text: string;
  generated_at: string;
};
