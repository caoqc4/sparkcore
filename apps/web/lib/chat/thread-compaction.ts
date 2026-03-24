import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  CompactedThreadSummary,
  ThreadCrossLayerSurvivalMode,
  ThreadKeepDropGovernanceSummary,
  ThreadKeepDropConvergenceSummary,
  ThreadKeepDropUnificationSummary,
  ThreadLifecycleCoordinationSummary,
  ThreadLifecycleConvergenceDigestId,
  ThreadLifecycleGovernanceDigestId,
  ThreadLifecycleAlignmentMode,
  ThreadLifecycleUnificationDigestId,
  ThreadLifecycleUnificationMode,
  ThreadRetentionDecisionGroup,
  ThreadRetentionLayer,
  ThreadRetentionLayerBudget,
  ThreadRetentionSection,
  ThreadRetentionSectionWeights,
  ThreadRetentionMode,
  ThreadRetentionPolicyId,
  ThreadRetentionReason,
  ThreadSurvivalConsistencyMode,
  ThreadSurvivalRationale
} from "../../../../packages/core/memory";

function resolveThreadRetentionMode(args: {
  threadState: ThreadStateRecord;
  recentTurnCount: number;
}) : ThreadRetentionMode {
  if (args.threadState.focus_mode) {
    return "focus_anchor";
  }

  if (args.threadState.continuity_status === "engaged") {
    return "continuity_anchor";
  }

  if (args.recentTurnCount >= 3) {
    return "recent_window";
  }

  return "minimal";
}

function resolveThreadRetentionSectionOrder(args: {
  retentionReason: ThreadRetentionReason;
}): ThreadRetentionSection[] {
  switch (args.retentionReason) {
    case "focus_mode_present":
      return ["focus_mode", "continuity_status", "current_language_hint"];
    case "engaged_continuity":
      return [
        "continuity_status",
        "current_language_hint",
        "latest_user_message"
      ];
    case "recent_turn_window":
      return [
        "recent_turn_window",
        "latest_user_message",
        "current_language_hint"
      ];
    case "minimal_context":
      return ["current_language_hint"];
    case "closed_minimal_pruned":
      return [];
  }
}

function buildRetainedFields(args: {
  threadState: ThreadStateRecord;
  retentionReason: ThreadRetentionReason;
  latestUserMessage: string | null;
  retentionLayerBudget: ThreadRetentionLayerBudget;
  retentionSectionOrder: ThreadRetentionSection[];
  retentionSectionWeights: ThreadRetentionSectionWeights;
}) {
  const fields: string[] = [];
  const remainingBudget: ThreadRetentionLayerBudget = {
    ...args.retentionLayerBudget
  };
  const orderedSections = [...args.retentionSectionOrder].sort((a, b) => {
    const weightDiff =
      (args.retentionSectionWeights[b] ?? 0) -
      (args.retentionSectionWeights[a] ?? 0);

    if (weightDiff !== 0) {
      return weightDiff;
    }

    return (
      args.retentionSectionOrder.indexOf(a) - args.retentionSectionOrder.indexOf(b)
    );
  });

  const pushField = (
    field: string,
    layer: ThreadRetentionLayer,
    condition: boolean
  ) => {
    if (condition && !fields.includes(field) && remainingBudget[layer] > 0) {
      fields.push(field);
      remainingBudget[layer] -= 1;
    }
  };

  for (const section of orderedSections) {
    switch (section) {
      case "focus_mode":
        pushField("focus_mode", "anchor", Boolean(args.threadState.focus_mode));
        break;
      case "continuity_status":
        pushField(
          "continuity_status",
          "anchor",
          Boolean(args.threadState.continuity_status)
        );
        break;
      case "current_language_hint":
        pushField(
          "current_language_hint",
          "context",
          Boolean(args.threadState.current_language_hint)
        );
        break;
      case "recent_turn_window":
        pushField("recent_turn_window", "window", true);
        break;
      case "latest_user_message":
        pushField("latest_user_message", "window", Boolean(args.latestUserMessage));
        break;
    }
  }

  return fields;
}

function resolveThreadRetentionSectionWeights(args: {
  retentionReason: ThreadRetentionReason;
  retentionLayerBudget: ThreadRetentionLayerBudget;
}): ThreadRetentionSectionWeights {
  switch (args.retentionReason) {
    case "focus_mode_present":
      return {
        focus_mode: 100 + args.retentionLayerBudget.anchor * 10,
        continuity_status: 90 + args.retentionLayerBudget.anchor * 10,
        current_language_hint: 30 + args.retentionLayerBudget.context * 10
      };
    case "engaged_continuity":
      return {
        continuity_status: 90 + args.retentionLayerBudget.anchor * 10,
        current_language_hint: 50 + args.retentionLayerBudget.context * 10,
        latest_user_message: 40 + args.retentionLayerBudget.window * 10
      };
    case "recent_turn_window":
      return {
        recent_turn_window: 90 + args.retentionLayerBudget.window * 10,
        latest_user_message: 80 + args.retentionLayerBudget.window * 10,
        current_language_hint: 40 + args.retentionLayerBudget.context * 10
      };
    case "minimal_context":
      return {
        current_language_hint: 20 + args.retentionLayerBudget.context * 10
      };
    case "closed_minimal_pruned":
      return {};
  }
}

function resolveThreadRetentionBudget(args: {
  retentionMode: ThreadRetentionMode;
  retentionReason: ThreadRetentionReason;
}) {
  switch (args.retentionMode) {
    case "focus_anchor":
      return 2;
    case "continuity_anchor":
      return 2;
    case "recent_window":
      return 3;
    case "minimal":
    default:
      return args.retentionReason === "closed_minimal_pruned" ? 0 : 1;
  }
}

function resolveThreadRetentionLayerBudget(args: {
  retentionMode: ThreadRetentionMode;
  retentionReason: ThreadRetentionReason;
  retentionBudget: number;
}): ThreadRetentionLayerBudget {
  switch (args.retentionMode) {
    case "focus_anchor":
      return {
        anchor: Math.min(2, args.retentionBudget),
        context: 0,
        window: 0
      };
    case "continuity_anchor":
      return {
        anchor: Math.min(1, args.retentionBudget),
        context: Math.max(0, Math.min(1, args.retentionBudget - 1)),
        window: 0
      };
    case "recent_window":
      return {
        anchor: 0,
        context: Math.min(1, args.retentionBudget),
        window: Math.max(0, args.retentionBudget - 1)
      };
    case "minimal":
    default:
      return {
        anchor: 0,
        context:
          args.retentionReason === "closed_minimal_pruned"
            ? 0
            : Math.min(1, args.retentionBudget),
        window: 0
      };
  }
}

function resolveThreadRetentionLayers(args: {
  retentionLayerBudget: ThreadRetentionLayerBudget;
}) {
  return (["anchor", "context", "window"] as const).filter(
    (layer) => args.retentionLayerBudget[layer] > 0
  );
}

function resolveThreadRetentionReason(args: {
  threadState: ThreadStateRecord;
  recentTurnCount: number;
  retentionMode: ThreadRetentionMode;
}) : ThreadRetentionReason {
  if (args.retentionMode === "focus_anchor") {
    return "focus_mode_present";
  }

  if (args.retentionMode === "continuity_anchor") {
    return "engaged_continuity";
  }

  if (args.retentionMode === "recent_window") {
    return "recent_turn_window";
  }

  return "minimal_context";
}

function resolveThreadRetentionPolicyId(args: {
  retentionMode: ThreadRetentionMode;
}): ThreadRetentionPolicyId {
  switch (args.retentionMode) {
    case "focus_anchor":
      return "focus_continuity_anchor";
    case "continuity_anchor":
      return "engaged_continuity_bridge";
    case "recent_window":
      return "recent_window_replay";
    case "minimal":
    default:
      return "minimal_context_decay";
  }
}

function resolveThreadCrossLayerSurvivalMode(args: {
  retentionMode: ThreadRetentionMode;
}): ThreadCrossLayerSurvivalMode {
  switch (args.retentionMode) {
    case "focus_anchor":
      return "anchor_only";
    case "continuity_anchor":
      return "anchor_then_context";
    case "recent_window":
      return "context_window_bias";
    case "minimal":
    default:
      return "context_only";
  }
}

function resolveThreadRetentionDecisionGroup(args: {
  lifecycleStatus: ThreadStateRecord["lifecycle_status"];
  retentionMode: ThreadRetentionMode;
}): ThreadRetentionDecisionGroup {
  if (
    args.lifecycleStatus === "closed" &&
    args.retentionMode === "minimal"
  ) {
    return "closed_decay_prune";
  }

  switch (args.retentionMode) {
    case "focus_anchor":
      return "anchor_preserve";
    case "continuity_anchor":
      return "continuity_bridge";
    case "recent_window":
      return "window_replay";
    case "minimal":
    default:
      return "minimal_decay";
  }
}

function resolveThreadSurvivalRationale(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadSurvivalRationale {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "focus_anchor_survives";
    case "continuity_bridge":
      return "continuity_bridge_survives";
    case "window_replay":
      return "recent_window_survives";
    case "minimal_decay":
      return "minimal_context_thins";
    case "closed_decay_prune":
      return "closed_context_pruned";
  }
}

function resolveThreadLifecycleGovernanceDigest(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleGovernanceDigestId {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_preservation_governance";
    case "continuity_bridge":
      return "continuity_bridge_governance";
    case "window_replay":
      return "window_replay_governance";
    case "minimal_decay":
      return "minimal_decay_governance";
    case "closed_decay_prune":
      return "closed_decay_governance";
  }
}

function resolveThreadKeepDropGovernanceSummary(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadKeepDropGovernanceSummary {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_keep_priority";
    case "continuity_bridge":
      return "bridge_keep_priority";
    case "window_replay":
      return "window_keep_priority";
    case "minimal_decay":
      return "minimal_decay_priority";
    case "closed_decay_prune":
      return "closed_drop_priority";
  }
}

function resolveThreadLifecycleCoordinationSummary(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleCoordinationSummary {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_only_coordination";
    case "continuity_bridge":
      return "anchor_context_bridge_coordination";
    case "window_replay":
      return "context_window_coordination";
    case "minimal_decay":
      return "minimal_context_coordination";
    case "closed_decay_prune":
      return "closed_decay_coordination";
  }
}

function resolveThreadSurvivalConsistencyMode(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadSurvivalConsistencyMode {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_keep_consistent";
    case "continuity_bridge":
      return "bridge_keep_consistent";
    case "window_replay":
      return "window_keep_consistent";
    case "minimal_decay":
      return "minimal_decay_consistent";
    case "closed_decay_prune":
      return "closed_drop_consistent";
  }
}

function resolveThreadLifecycleConvergenceDigest(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleConvergenceDigestId {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_preservation_convergence";
    case "continuity_bridge":
      return "continuity_bridge_convergence";
    case "window_replay":
      return "window_replay_convergence";
    case "minimal_decay":
      return "minimal_decay_convergence";
    case "closed_decay_prune":
      return "closed_decay_convergence";
  }
}

function resolveThreadKeepDropConvergenceSummary(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadKeepDropConvergenceSummary {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_keep_alignment";
    case "continuity_bridge":
      return "bridge_keep_alignment";
    case "window_replay":
      return "window_keep_alignment";
    case "minimal_decay":
      return "minimal_decay_alignment";
    case "closed_decay_prune":
      return "closed_drop_alignment";
  }
}

function resolveThreadLifecycleAlignmentMode(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleAlignmentMode {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_governance_aligned";
    case "continuity_bridge":
      return "bridge_governance_aligned";
    case "window_replay":
      return "window_governance_aligned";
    case "minimal_decay":
      return "minimal_governance_aligned";
    case "closed_decay_prune":
      return "closed_governance_aligned";
  }
}

function resolveThreadLifecycleUnificationDigest(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleUnificationDigestId {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_preservation_unification";
    case "continuity_bridge":
      return "continuity_bridge_unification";
    case "window_replay":
      return "window_replay_unification";
    case "minimal_decay":
      return "minimal_decay_unification";
    case "closed_decay_prune":
      return "closed_decay_unification";
  }
}

function resolveThreadKeepDropUnificationSummary(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadKeepDropUnificationSummary {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_keep_unified";
    case "continuity_bridge":
      return "bridge_keep_unified";
    case "window_replay":
      return "window_keep_unified";
    case "minimal_decay":
      return "minimal_decay_unified";
    case "closed_decay_prune":
      return "closed_drop_unified";
  }
}

function resolveThreadLifecycleUnificationMode(args: {
  retentionDecisionGroup: ThreadRetentionDecisionGroup;
}): ThreadLifecycleUnificationMode {
  switch (args.retentionDecisionGroup) {
    case "anchor_preserve":
      return "anchor_runtime_unified";
    case "continuity_bridge":
      return "bridge_runtime_unified";
    case "window_replay":
      return "window_runtime_unified";
    case "minimal_decay":
      return "minimal_runtime_unified";
    case "closed_decay_prune":
      return "closed_runtime_unified";
  }
}

export function buildCompactedThreadSummary(args: {
  threadState: ThreadStateRecord | null | undefined;
  recentTurnCount: number;
  latestUserMessage: string | null | undefined;
  generatedAt?: string;
}): CompactedThreadSummary | null {
  if (!args.threadState) {
    return null;
  }

  const focus = args.threadState.focus_mode ?? "No explicit focus";
  const continuity = args.threadState.continuity_status ?? "cold";
  const latestUserMessage =
    typeof args.latestUserMessage === "string" &&
    args.latestUserMessage.trim().length > 0
      ? args.latestUserMessage.trim()
      : null;
  const retentionMode = resolveThreadRetentionMode({
    threadState: args.threadState,
    recentTurnCount: args.recentTurnCount
  });
  const retentionReason = resolveThreadRetentionReason({
    threadState: args.threadState,
    recentTurnCount: args.recentTurnCount,
    retentionMode
  });
  const retentionBudget = resolveThreadRetentionBudget({
    retentionMode,
    retentionReason
  });
  const retentionLayerBudget = resolveThreadRetentionLayerBudget({
    retentionMode,
    retentionReason,
    retentionBudget
  });
  const retentionPolicyId = resolveThreadRetentionPolicyId({
    retentionMode
  });
  const retentionSectionOrder = resolveThreadRetentionSectionOrder({
    retentionReason
  });
  const retentionSectionWeights = resolveThreadRetentionSectionWeights({
    retentionReason,
    retentionLayerBudget
  });
  const retentionLayers = resolveThreadRetentionLayers({
    retentionLayerBudget
  });
  const crossLayerSurvivalMode = resolveThreadCrossLayerSurvivalMode({
    retentionMode
  });
  const retentionDecisionGroup = resolveThreadRetentionDecisionGroup({
    lifecycleStatus: args.threadState.lifecycle_status,
    retentionMode
  });
  const survivalRationale = resolveThreadSurvivalRationale({
    retentionDecisionGroup
  });
  const lifecycleGovernanceDigest = resolveThreadLifecycleGovernanceDigest({
    retentionDecisionGroup
  });
  const keepDropGovernanceSummary = resolveThreadKeepDropGovernanceSummary({
    retentionDecisionGroup
  });
  const lifecycleCoordinationSummary =
    resolveThreadLifecycleCoordinationSummary({
      retentionDecisionGroup
    });
  const survivalConsistencyMode = resolveThreadSurvivalConsistencyMode({
    retentionDecisionGroup
  });
  const lifecycleConvergenceDigest = resolveThreadLifecycleConvergenceDigest({
    retentionDecisionGroup
  });
  const keepDropConvergenceSummary = resolveThreadKeepDropConvergenceSummary({
    retentionDecisionGroup
  });
  const lifecycleAlignmentMode = resolveThreadLifecycleAlignmentMode({
    retentionDecisionGroup
  });
  const lifecycleUnificationDigest = resolveThreadLifecycleUnificationDigest({
    retentionDecisionGroup
  });
  const keepDropUnificationSummary = resolveThreadKeepDropUnificationSummary({
    retentionDecisionGroup
  });
  const lifecycleUnificationMode = resolveThreadLifecycleUnificationMode({
    retentionDecisionGroup
  });
  const retainedFields = buildRetainedFields({
    threadState: args.threadState,
    retentionReason,
    latestUserMessage,
    retentionLayerBudget,
    retentionSectionOrder,
    retentionSectionWeights
  });

  const summaryParts = [
    retainedFields.includes("focus_mode") ? `Focus: ${focus}.` : null,
    retainedFields.includes("continuity_status")
      ? `Continuity: ${continuity}.`
      : null,
    retainedFields.includes("current_language_hint")
      ? `Language hint: ${args.threadState.current_language_hint}.`
      : null,
    retainedFields.includes("recent_turn_window")
      ? `Recent turn window: ${args.recentTurnCount}.`
      : null,
    retainedFields.includes("latest_user_message")
      ? `Latest user message: ${latestUserMessage}.`
      : null,
    `Retention budget: ${retentionBudget}.`,
    `Retention layers: ${retentionLayers.join(",") || "none"}.`,
    `Retention section order: ${retentionSectionOrder.join(",") || "none"}.`,
    `Retention section weights: ${retentionSectionOrder
      .map(
        (section) =>
          `${section}=${retentionSectionWeights[section] ?? 0}`
      )
      .join(",") || "none"}.`,
    `Retention mode: ${retentionMode}.`,
    `Retention reason: ${retentionReason}.`,
    `Retention policy: ${retentionPolicyId}.`,
    `Cross-layer survival: ${crossLayerSurvivalMode}.`,
    `Retention decision group: ${retentionDecisionGroup}.`,
    `Survival rationale: ${survivalRationale}.`,
    `Lifecycle governance digest: ${lifecycleGovernanceDigest}.`,
    `Keep/drop governance: ${keepDropGovernanceSummary}.`,
    `Lifecycle coordination: ${lifecycleCoordinationSummary}.`,
    `Survival consistency: ${survivalConsistencyMode}.`,
    `Lifecycle convergence: ${lifecycleConvergenceDigest}.`,
    `Keep/drop convergence: ${keepDropConvergenceSummary}.`,
    `Lifecycle alignment: ${lifecycleAlignmentMode}.`,
    `Lifecycle unification: ${lifecycleUnificationDigest}.`,
    `Keep/drop unification: ${keepDropUnificationSummary}.`,
    `Lifecycle unification mode: ${lifecycleUnificationMode}.`,
  ].filter((part): part is string => Boolean(part));

  return {
    summary_id: `thread_compacted:${args.threadState.thread_id}`,
    thread_id: args.threadState.thread_id,
    agent_id: args.threadState.agent_id,
    lifecycle_status: args.threadState.lifecycle_status,
    continuity_status: args.threadState.continuity_status ?? null,
    focus_mode: args.threadState.focus_mode ?? null,
    current_language_hint: args.threadState.current_language_hint ?? null,
    retention_mode: retentionMode,
    retention_reason: retentionReason,
    retention_policy_id: retentionPolicyId,
    cross_layer_survival_mode: crossLayerSurvivalMode,
    retention_decision_group: retentionDecisionGroup,
    survival_rationale: survivalRationale,
    lifecycle_governance_digest: lifecycleGovernanceDigest,
    keep_drop_governance_summary: keepDropGovernanceSummary,
    lifecycle_coordination_summary: lifecycleCoordinationSummary,
    survival_consistency_mode: survivalConsistencyMode,
    lifecycle_convergence_digest: lifecycleConvergenceDigest,
    keep_drop_convergence_summary: keepDropConvergenceSummary,
    lifecycle_alignment_mode: lifecycleAlignmentMode,
    lifecycle_unification_digest: lifecycleUnificationDigest,
    keep_drop_unification_summary: keepDropUnificationSummary,
    lifecycle_unification_mode: lifecycleUnificationMode,
    retention_budget: retentionBudget,
    retention_layers: retentionLayers,
    retention_layer_budget: retentionLayerBudget,
    retention_section_order: retentionSectionOrder,
    retention_section_weights: retentionSectionWeights,
    retained_fields: retainedFields,
    summary_text: summaryParts.join(" "),
    generated_at: args.generatedAt ?? new Date().toISOString()
  };
}

export function shouldRetainCompactedThreadSummary(args: {
  compactedThreadSummary: CompactedThreadSummary | null | undefined;
}) {
  return getThreadCompactionRetentionDecision(args).retain;
}

export function getThreadCompactionRetentionDecision(args: {
  compactedThreadSummary: CompactedThreadSummary | null | undefined;
}) {
  const summary = args.compactedThreadSummary;

  if (!summary) {
    return { retain: false, reason: null as ThreadRetentionReason | null };
  }

  if (summary.retained_fields.length === 0) {
    return {
      retain: false,
      reason:
        summary.keep_drop_convergence_summary === "closed_drop_alignment"
          ? ("closed_minimal_pruned" as const)
          : ("minimal_context" as const)
    };
  }

  if (
    summary.keep_drop_convergence_summary === "closed_drop_alignment" &&
    summary.lifecycle_alignment_mode === "closed_governance_aligned"
  ) {
    return { retain: false, reason: "closed_minimal_pruned" as const };
  }

  if (
    summary.lifecycle_status === "paused" &&
    summary.keep_drop_convergence_summary === "minimal_decay_alignment" &&
    summary.lifecycle_alignment_mode === "minimal_governance_aligned" &&
    summary.retention_budget <= 1
  ) {
    return { retain: false, reason: "minimal_context" as const };
  }

  return { retain: true, reason: summary.retention_reason };
}

export function selectRetainedThreadCompactionSummary(args: {
  compactedThreadSummary: CompactedThreadSummary | null | undefined;
}) {
  return shouldRetainCompactedThreadSummary(args)
    ? (args.compactedThreadSummary ?? null)
    : null;
}

export function buildThreadCompactionPromptSection(args: {
  compactedThreadSummary: CompactedThreadSummary | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (!args.compactedThreadSummary) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";

  return [
    isZh ? "线程压缩摘要：" : "Compacted thread summary:",
    isZh
      ? `${args.compactedThreadSummary.summary_text} 当前 retention mode = ${args.compactedThreadSummary.retention_mode}，retention reason = ${args.compactedThreadSummary.retention_reason}，section 顺序：${args.compactedThreadSummary.retention_section_order.join("、") || "无"}，保留字段：${args.compactedThreadSummary.retained_fields.join("、") || "无"}。把这段摘要当作线程历史压缩结果，而不是新的长期画像或外部知识。`
      : `${args.compactedThreadSummary.summary_text} Current retention mode = ${args.compactedThreadSummary.retention_mode}; retention reason = ${args.compactedThreadSummary.retention_reason}; decision group = ${args.compactedThreadSummary.retention_decision_group}; survival rationale = ${args.compactedThreadSummary.survival_rationale}; lifecycle governance digest = ${args.compactedThreadSummary.lifecycle_governance_digest}; keep/drop governance = ${args.compactedThreadSummary.keep_drop_governance_summary}; lifecycle coordination = ${args.compactedThreadSummary.lifecycle_coordination_summary}; survival consistency = ${args.compactedThreadSummary.survival_consistency_mode}; lifecycle convergence = ${args.compactedThreadSummary.lifecycle_convergence_digest}; keep/drop convergence = ${args.compactedThreadSummary.keep_drop_convergence_summary}; lifecycle alignment = ${args.compactedThreadSummary.lifecycle_alignment_mode}; lifecycle unification = ${args.compactedThreadSummary.lifecycle_unification_digest}; keep/drop unification = ${args.compactedThreadSummary.keep_drop_unification_summary}; lifecycle unification mode = ${args.compactedThreadSummary.lifecycle_unification_mode}; section order: ${args.compactedThreadSummary.retention_section_order.join(", ") || "none"}; retention layers: ${args.compactedThreadSummary.retention_layers.join(", ") || "none"}; retained fields: ${args.compactedThreadSummary.retained_fields.join(", ") || "none"}. Treat this as compacted thread history, not as a new long-term profile or external knowledge.`
  ].join("\n");
}

export function buildThreadCompactionSummary(args: {
  compactedThreadSummary: CompactedThreadSummary | null;
}) {
  return args.compactedThreadSummary
      ? {
          summary_id: args.compactedThreadSummary.summary_id,
          lifecycle_status: args.compactedThreadSummary.lifecycle_status,
          continuity_status: args.compactedThreadSummary.continuity_status,
          focus_mode: args.compactedThreadSummary.focus_mode,
          current_language_hint:
            args.compactedThreadSummary.current_language_hint,
          retention_mode: args.compactedThreadSummary.retention_mode,
          retention_reason: args.compactedThreadSummary.retention_reason,
          retention_policy_id: args.compactedThreadSummary.retention_policy_id,
          cross_layer_survival_mode:
            args.compactedThreadSummary.cross_layer_survival_mode,
          retention_decision_group:
            args.compactedThreadSummary.retention_decision_group,
          survival_rationale:
            args.compactedThreadSummary.survival_rationale,
          lifecycle_governance_digest:
            args.compactedThreadSummary.lifecycle_governance_digest,
          keep_drop_governance_summary:
            args.compactedThreadSummary.keep_drop_governance_summary,
          lifecycle_coordination_summary:
            args.compactedThreadSummary.lifecycle_coordination_summary,
          survival_consistency_mode:
            args.compactedThreadSummary.survival_consistency_mode,
          lifecycle_convergence_digest:
            args.compactedThreadSummary.lifecycle_convergence_digest,
          keep_drop_convergence_summary:
            args.compactedThreadSummary.keep_drop_convergence_summary,
          lifecycle_alignment_mode:
            args.compactedThreadSummary.lifecycle_alignment_mode,
          lifecycle_unification_digest:
            args.compactedThreadSummary.lifecycle_unification_digest,
          keep_drop_unification_summary:
            args.compactedThreadSummary.keep_drop_unification_summary,
          lifecycle_unification_mode:
            args.compactedThreadSummary.lifecycle_unification_mode,
          retention_budget: args.compactedThreadSummary.retention_budget,
          retention_layers: args.compactedThreadSummary.retention_layers,
          retention_layer_budget:
            args.compactedThreadSummary.retention_layer_budget,
          retention_section_order:
            args.compactedThreadSummary.retention_section_order,
          retention_section_weights:
            args.compactedThreadSummary.retention_section_weights,
          retained_fields: args.compactedThreadSummary.retained_fields,
      }
    : null;
}
