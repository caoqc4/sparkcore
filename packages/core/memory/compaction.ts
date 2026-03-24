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

export type ThreadLifecycleGovernanceDigestId =
  | "anchor_preservation_governance"
  | "continuity_bridge_governance"
  | "window_replay_governance"
  | "minimal_decay_governance"
  | "closed_decay_governance";

export type ThreadKeepDropGovernanceSummary =
  | "anchor_keep_priority"
  | "bridge_keep_priority"
  | "window_keep_priority"
  | "minimal_decay_priority"
  | "closed_drop_priority";

export type ThreadLifecycleCoordinationSummary =
  | "anchor_only_coordination"
  | "anchor_context_bridge_coordination"
  | "context_window_coordination"
  | "minimal_context_coordination"
  | "closed_decay_coordination";

export type ThreadSurvivalConsistencyMode =
  | "anchor_keep_consistent"
  | "bridge_keep_consistent"
  | "window_keep_consistent"
  | "minimal_decay_consistent"
  | "closed_drop_consistent";

export type ThreadLifecycleConvergenceDigestId =
  | "anchor_preservation_convergence"
  | "continuity_bridge_convergence"
  | "window_replay_convergence"
  | "minimal_decay_convergence"
  | "closed_decay_convergence";

export type ThreadKeepDropConvergenceSummary =
  | "anchor_keep_alignment"
  | "bridge_keep_alignment"
  | "window_keep_alignment"
  | "minimal_decay_alignment"
  | "closed_drop_alignment";

export type ThreadLifecycleAlignmentMode =
  | "anchor_governance_aligned"
  | "bridge_governance_aligned"
  | "window_governance_aligned"
  | "minimal_governance_aligned"
  | "closed_governance_aligned";

export type ThreadLifecycleUnificationDigestId =
  | "anchor_preservation_unification"
  | "continuity_bridge_unification"
  | "window_replay_unification"
  | "minimal_decay_unification"
  | "closed_decay_unification";

export type ThreadKeepDropUnificationSummary =
  | "anchor_keep_unified"
  | "bridge_keep_unified"
  | "window_keep_unified"
  | "minimal_decay_unified"
  | "closed_drop_unified";

export type ThreadLifecycleUnificationMode =
  | "anchor_runtime_unified"
  | "bridge_runtime_unified"
  | "window_runtime_unified"
  | "minimal_runtime_unified"
  | "closed_runtime_unified";

export type ThreadLifecycleConsolidationDigestId =
  | "anchor_preservation_consolidation"
  | "continuity_bridge_consolidation"
  | "window_replay_consolidation"
  | "minimal_decay_consolidation"
  | "closed_decay_consolidation";

export type ThreadKeepDropConsolidationSummary =
  | "anchor_keep_consolidated"
  | "bridge_keep_consolidated"
  | "window_keep_consolidated"
  | "minimal_decay_consolidated"
  | "closed_drop_consolidated";

export type ThreadLifecycleConsolidationMode =
  | "anchor_runtime_consolidated"
  | "bridge_runtime_consolidated"
  | "window_runtime_consolidated"
  | "minimal_runtime_consolidated"
  | "closed_runtime_consolidated";

export type ThreadLifecycleCoordinationDigestId =
  | "anchor_preservation_coordination"
  | "continuity_bridge_coordination"
  | "window_replay_coordination"
  | "minimal_decay_coordination"
  | "closed_decay_coordination";

export type ThreadKeepDropConsolidationCoordinationSummary =
  | "anchor_keep_consolidation_coordination"
  | "bridge_keep_consolidation_coordination"
  | "window_keep_consolidation_coordination"
  | "minimal_decay_consolidation_coordination"
  | "closed_drop_consolidation_coordination";

export type ThreadLifecycleCoordinationAlignmentMode =
  | "anchor_consolidation_aligned"
  | "bridge_consolidation_aligned"
  | "window_consolidation_aligned"
  | "minimal_consolidation_aligned"
  | "closed_consolidation_aligned";

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
  lifecycle_governance_digest: ThreadLifecycleGovernanceDigestId;
  keep_drop_governance_summary: ThreadKeepDropGovernanceSummary;
  lifecycle_coordination_summary: ThreadLifecycleCoordinationSummary;
  survival_consistency_mode: ThreadSurvivalConsistencyMode;
  lifecycle_convergence_digest: ThreadLifecycleConvergenceDigestId;
  keep_drop_convergence_summary: ThreadKeepDropConvergenceSummary;
  lifecycle_alignment_mode: ThreadLifecycleAlignmentMode;
  lifecycle_unification_digest: ThreadLifecycleUnificationDigestId;
  keep_drop_unification_summary: ThreadKeepDropUnificationSummary;
  lifecycle_unification_mode: ThreadLifecycleUnificationMode;
  lifecycle_consolidation_digest: ThreadLifecycleConsolidationDigestId;
  keep_drop_consolidation_summary: ThreadKeepDropConsolidationSummary;
  lifecycle_consolidation_mode: ThreadLifecycleConsolidationMode;
  lifecycle_coordination_digest: ThreadLifecycleCoordinationDigestId;
  keep_drop_consolidation_coordination_summary: ThreadKeepDropConsolidationCoordinationSummary;
  lifecycle_coordination_alignment_mode: ThreadLifecycleCoordinationAlignmentMode;
  retention_budget: number;
  retention_layers: ThreadRetentionLayer[];
  retention_layer_budget: ThreadRetentionLayerBudget;
  retention_section_order: ThreadRetentionSection[];
  retention_section_weights: ThreadRetentionSectionWeights;
  retained_fields: string[];
  summary_text: string;
  generated_at: string;
};
