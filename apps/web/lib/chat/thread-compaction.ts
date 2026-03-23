import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  CompactedThreadSummary,
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
}) {
  const fields = new Set<string>();

  switch (args.retentionReason) {
    case "focus_mode_present":
      if (args.threadState.focus_mode) {
        fields.add("focus_mode");
      }
      if (args.threadState.continuity_status) {
        fields.add("continuity_status");
      }
      if (args.threadState.current_language_hint) {
        fields.add("current_language_hint");
      }
      break;
    case "engaged_continuity":
      if (args.threadState.continuity_status) {
        fields.add("continuity_status");
      }
      if (args.threadState.current_language_hint) {
        fields.add("current_language_hint");
      }
      if (args.latestUserMessage) {
        fields.add("latest_user_message");
      }
      break;
    case "recent_turn_window":
      if (args.threadState.current_language_hint) {
        fields.add("current_language_hint");
      }
      if (args.latestUserMessage) {
        fields.add("latest_user_message");
      }
      fields.add("recent_turn_window");
      break;
    case "minimal_context":
      if (args.threadState.current_language_hint) {
        fields.add("current_language_hint");
      }
      break;
    case "closed_minimal_pruned":
      break;
  }

  return Array.from(fields);
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
  const retainedFields = buildRetainedFields({
    threadState: args.threadState,
    retentionReason,
    latestUserMessage
  });
  const retentionBudget = resolveThreadRetentionBudget({
    retentionMode,
    retentionReason
  });

  const summaryParts = [
    retainedFields.includes("focus_mode") ? `Focus: ${focus}.` : null,
    retainedFields.includes("continuity_status")
      ? `Continuity: ${continuity}.`
      : null,
    retainedFields.includes("recent_turn_window")
      ? `Recent turn window: ${args.recentTurnCount}.`
      : null,
    retainedFields.includes("latest_user_message")
      ? `Latest user message: ${latestUserMessage}.`
      : null,
    `Retention budget: ${retentionBudget}.`,
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
      : `${args.compactedThreadSummary.summary_text} Current retention mode = ${args.compactedThreadSummary.retention_mode}; retention reason = ${args.compactedThreadSummary.retention_reason}; retained fields: ${args.compactedThreadSummary.retained_fields.join(", ") || "none"}. Treat this as compacted thread history, not as a new long-term profile or external knowledge.`
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
          retained_fields: args.compactedThreadSummary.retained_fields,
      }
    : null;
}
