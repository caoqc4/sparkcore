import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  CompactedThreadSummary,
  ThreadRetentionLayer,
  ThreadRetentionLayerBudget,
  ThreadRetentionMode,
  ThreadRetentionReason
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

function buildRetainedFields(args: {
  threadState: ThreadStateRecord;
  retentionReason: ThreadRetentionReason;
  latestUserMessage: string | null;
  retentionLayerBudget: ThreadRetentionLayerBudget;
}) {
  const fields: string[] = [];
  const remainingBudget: ThreadRetentionLayerBudget = {
    ...args.retentionLayerBudget
  };

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

  switch (args.retentionReason) {
    case "focus_mode_present":
      pushField("focus_mode", "anchor", Boolean(args.threadState.focus_mode));
      pushField(
        "continuity_status",
        "anchor",
        Boolean(args.threadState.continuity_status)
      );
      pushField(
        "current_language_hint",
        "context",
        Boolean(args.threadState.current_language_hint)
      );
      break;
    case "engaged_continuity":
      pushField(
        "continuity_status",
        "anchor",
        Boolean(args.threadState.continuity_status)
      );
      pushField(
        "current_language_hint",
        "context",
        Boolean(args.threadState.current_language_hint)
      );
      pushField("latest_user_message", "window", Boolean(args.latestUserMessage));
      break;
    case "recent_turn_window":
      pushField(
        "current_language_hint",
        "context",
        Boolean(args.threadState.current_language_hint)
      );
      pushField("latest_user_message", "window", Boolean(args.latestUserMessage));
      pushField("recent_turn_window", "window", true);
      break;
    case "minimal_context":
      pushField(
        "current_language_hint",
        "context",
        Boolean(args.threadState.current_language_hint)
      );
      break;
    case "closed_minimal_pruned":
      break;
  }

  return fields;
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
  const retentionLayers = resolveThreadRetentionLayers({
    retentionLayerBudget
  });
  const retainedFields = buildRetainedFields({
    threadState: args.threadState,
    retentionReason,
    latestUserMessage,
    retentionLayerBudget
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
    `Retention mode: ${retentionMode}.`,
    `Retention reason: ${retentionReason}.`,
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
    retention_budget: retentionBudget,
    retention_layers: retentionLayers,
    retention_layer_budget: retentionLayerBudget,
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
    return { retain: false, reason: "minimal_context" as const };
  }

  if (
    summary.lifecycle_status === "closed" &&
    summary.retention_mode === "minimal"
  ) {
    return { retain: false, reason: "closed_minimal_pruned" as const };
  }

  if (
    summary.lifecycle_status === "paused" &&
    summary.retention_reason === "minimal_context" &&
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
      ? `${args.compactedThreadSummary.summary_text} 当前 retention mode = ${args.compactedThreadSummary.retention_mode}，retention reason = ${args.compactedThreadSummary.retention_reason}，保留字段：${args.compactedThreadSummary.retained_fields.join("、") || "无"}。把这段摘要当作线程历史压缩结果，而不是新的长期画像或外部知识。`
      : `${args.compactedThreadSummary.summary_text} Current retention mode = ${args.compactedThreadSummary.retention_mode}; retention reason = ${args.compactedThreadSummary.retention_reason}; retention layers: ${args.compactedThreadSummary.retention_layers.join(", ") || "none"}; retained fields: ${args.compactedThreadSummary.retained_fields.join(", ") || "none"}. Treat this as compacted thread history, not as a new long-term profile or external knowledge.`
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
          retention_budget: args.compactedThreadSummary.retention_budget,
          retention_layers: args.compactedThreadSummary.retention_layers,
          retention_layer_budget:
            args.compactedThreadSummary.retention_layer_budget,
          retained_fields: args.compactedThreadSummary.retained_fields,
      }
    : null;
}
