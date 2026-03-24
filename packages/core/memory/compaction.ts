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

export type ThreadRetentionPolicyId =
  | "focus_continuity_anchor"
  | "engaged_continuity_bridge"
  | "recent_window_replay"
  | "minimal_context_decay";

export type ThreadCrossLayerSurvivalMode =
  | "anchor_only"
  | "anchor_then_context"
  | "context_window_bias"
  | "context_only";

export type ThreadRetentionDecisionGroup =
  | "anchor_preserve"
  | "continuity_bridge"
  | "window_replay"
  | "minimal_decay"
  | "closed_decay_prune";

export type ThreadSurvivalRationale =
  | "focus_anchor_survives"
  | "continuity_bridge_survives"
  | "recent_window_survives"
  | "minimal_context_thins"
  | "closed_context_pruned";

export type ThreadRetentionLayer = "anchor" | "context" | "window";

export type ThreadRetentionLayerBudget = {
  anchor: number;
  context: number;
  window: number;
};

export type ThreadRetentionSection =
  | "focus_mode"
  | "continuity_status"
  | "current_language_hint"
  | "recent_turn_window"
  | "latest_user_message";

export type ThreadRetentionSectionWeights = Partial<
  Record<ThreadRetentionSection, number>
>;

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
  retention_policy_id: ThreadRetentionPolicyId;
  cross_layer_survival_mode: ThreadCrossLayerSurvivalMode;
  retention_decision_group: ThreadRetentionDecisionGroup;
  survival_rationale: ThreadSurvivalRationale;
  retention_budget: number;
  retention_layers: ThreadRetentionLayer[];
  retention_layer_budget: ThreadRetentionLayerBudget;
  retention_section_order: ThreadRetentionSection[];
  retention_section_weights: ThreadRetentionSectionWeights;
  retained_fields: string[];
  summary_text: string;
  generated_at: string;
};
