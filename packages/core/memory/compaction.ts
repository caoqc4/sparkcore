export type CompactedThreadLifecycleStatus = "active" | "paused" | "closed";

export type CompactedThreadContinuityStatus = "cold" | "warm" | "engaged";

export type ThreadRetentionMode =
  | "focus_anchor"
  | "continuity_anchor"
  | "recent_window"
  | "minimal";

export type ThreadRetentionReason =
  | "focus_mode_present"
  | "engaged_continuity"
  | "recent_turn_window"
  | "minimal_context"
  | "closed_minimal_pruned";

export type ThreadRetentionLayer = "anchor" | "context" | "window";

export type ThreadRetentionLayerBudget = {
  anchor: number;
  context: number;
  window: number;
};

export type CompactedThreadSummary = {
  summary_id: string;
  thread_id: string;
  agent_id: string;
  lifecycle_status: CompactedThreadLifecycleStatus;
  continuity_status: CompactedThreadContinuityStatus | null;
  focus_mode: string | null;
  current_language_hint: string | null;
  retention_mode: ThreadRetentionMode;
  retention_reason: ThreadRetentionReason;
  retention_budget: number;
  retention_layers: ThreadRetentionLayer[];
  retention_layer_budget: ThreadRetentionLayerBudget;
  retained_fields: string[];
  summary_text: string;
  generated_at: string;
};
