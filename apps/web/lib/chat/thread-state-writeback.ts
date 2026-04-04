import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { ThreadContinuityStatus } from "@/lib/chat/thread-state";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { ThreadStateRepository } from "@/lib/chat/thread-state-repository";

export type WriteThreadStateAfterTurnInput = {
  prepared: PreparedRuntimeTurn;
  result: RuntimeTurnResult;
  repository: ThreadStateRepository;
  repository_name?: "supabase" | "in_memory" | "unknown";
};

export type ThreadStateFocusProjectionReason =
  | "preserve_existing_focus"
  | "topic_shift_clear"
  | "subtask_refinement"
  | "task_projection"
  | "no_focus_change";

export type ThreadStateContinuityProjectionReason =
  | "first_turn_warm"
  | "topic_shift_relax"
  | "engaged_follow_up"
  | "focus_change_engaged"
  | "preserve_base_continuity";

export type WriteThreadStateAfterTurnResult =
  | {
      status: "written";
      repository: "supabase" | "in_memory" | "unknown";
      thread_state: ThreadStateRecord;
      anchor_mode: "current_assistant_message" | "previous_assistant_message";
      focus_projection_reason: ThreadStateFocusProjectionReason;
      continuity_projection_reason: ThreadStateContinuityProjectionReason;
    }
  | {
      status: "skipped";
      repository: "supabase" | "in_memory" | "unknown";
      reason: string;
    }
  | {
      status: "failed";
      repository: "supabase" | "in_memory" | "unknown";
      reason: string;
    };

function compactThreadStateFocusText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 96) {
    return normalized;
  }

  return `${normalized.slice(0, 95).trimEnd()}…`;
}

function shouldPreserveExistingFocusMode(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.length <= 6 ||
    [
      "好",
      "好的",
      "继续",
      "继续吧",
      "然后呢",
      "嗯",
      "嗯嗯",
      "ok",
      "okay",
      "yes",
      "go on",
      "continue"
    ].includes(normalized)
  );
}

function shouldProjectFocusModeFromMessage(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();

  if (!normalized || normalized.length < 6) {
    return false;
  }

  return [
    "帮我",
    "一起",
    "整理",
    "规划",
    "计划",
    "方案",
    "总结",
    "复盘",
    "改一下",
    "写一个",
    "写一版",
    "继续做",
    "继续推进",
    "推进这个",
    "how do i",
    "help me",
    "plan",
    "draft",
    "organize",
    "summarize",
    "roadmap",
    "next step",
    "next steps"
  ].some((pattern) => normalized.includes(pattern));
}

function shouldProjectRefinedFocusModeFromMessage(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();

  if (!normalized || normalized.length < 4) {
    return false;
  }

  return [
    "先把",
    "先看",
    "先写",
    "先做",
    "先整理",
    "先处理",
    "先讲",
    "重点放在",
    "重点讲",
    "聚焦",
    "只看",
    "先聊",
    "先从",
    "先按",
    "start with",
    "focus on",
    "let's focus on",
    "lets focus on",
    "first,",
    "first ",
    "for now",
    "just cover",
    "start by"
  ].some((pattern) => normalized.includes(pattern));
}

function shouldClearExistingFocusMode(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return [
    "换个话题",
    "聊点别的",
    "先不聊这个",
    "这个先放一放",
    "这个之后再说",
    "先到这里",
    "先这样吧",
    "算了",
    "没事了",
    "不说这个了",
    "later",
    "another topic",
    "something else",
    "leave that for later",
    "let's switch topics",
    "lets switch topics",
    "we can stop here"
  ].some((pattern) => normalized.includes(pattern));
}

function shouldMarkThreadAsEngaged(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return (
    shouldPreserveExistingFocusMode(value) ||
    shouldProjectFocusModeFromMessage(value) ||
    [
      "继续",
      "然后呢",
      "展开说说",
      "详细一点",
      "具体一点",
      "继续讲",
      "接着说",
      "下一步",
      "下一步呢",
      "go on",
      "continue",
      "tell me more",
      "next step",
      "next steps",
      "be more specific"
    ].some((pattern) => normalized.includes(pattern))
  );
}

function resolveThreadStateFocusMode(args: {
  baseFocusMode: string | null | undefined;
  latestUserMessage: string | null | undefined;
}): {
  focusMode: string | null;
  reason: ThreadStateFocusProjectionReason;
} {
  const latestUserMessage =
    typeof args.latestUserMessage === "string"
      ? args.latestUserMessage.trim()
      : "";

  if (!latestUserMessage) {
    return {
      focusMode: args.baseFocusMode ?? null,
      reason: "no_focus_change"
    };
  }

  if (args.baseFocusMode && shouldPreserveExistingFocusMode(latestUserMessage)) {
    return {
      focusMode: args.baseFocusMode,
      reason: "preserve_existing_focus"
    };
  }

  if (shouldClearExistingFocusMode(latestUserMessage)) {
    return {
      focusMode: null,
      reason: "topic_shift_clear"
    };
  }

  if (args.baseFocusMode && shouldProjectRefinedFocusModeFromMessage(latestUserMessage)) {
    return {
      focusMode: compactThreadStateFocusText(latestUserMessage),
      reason: "subtask_refinement"
    };
  }

  if (shouldProjectFocusModeFromMessage(latestUserMessage)) {
    return {
      focusMode: compactThreadStateFocusText(latestUserMessage),
      reason: "task_projection"
    };
  }

  return {
    focusMode: args.baseFocusMode ?? null,
    reason: "no_focus_change"
  };
}

function resolveThreadStateContinuityStatus(args: {
  baseContinuityStatus: ThreadContinuityStatus | null | undefined;
  latestUserMessage: string | null | undefined;
  hasPriorAssistantTurn: boolean;
  nextFocusMode: string | null | undefined;
  previousFocusMode: string | null | undefined;
}): {
  continuityStatus: ThreadContinuityStatus;
  reason: ThreadStateContinuityProjectionReason;
} {
  const latestUserMessage =
    typeof args.latestUserMessage === "string"
      ? args.latestUserMessage.trim()
      : "";

  if (!args.hasPriorAssistantTurn) {
    return {
      continuityStatus: args.baseContinuityStatus ?? "warm",
      reason: "first_turn_warm"
    };
  }

  if (!latestUserMessage) {
    return {
      continuityStatus: args.baseContinuityStatus ?? "warm",
      reason: "preserve_base_continuity"
    };
  }

  if (shouldClearExistingFocusMode(latestUserMessage)) {
    return {
      continuityStatus: "warm",
      reason: "topic_shift_relax"
    };
  }

  if (shouldMarkThreadAsEngaged(latestUserMessage)) {
    return {
      continuityStatus: "engaged",
      reason: "engaged_follow_up"
    };
  }

  if (
    (args.previousFocusMode && args.nextFocusMode === args.previousFocusMode) ||
    (!!args.nextFocusMode && args.nextFocusMode !== args.previousFocusMode)
  ) {
    return {
      continuityStatus: "engaged",
      reason: "focus_change_engaged"
    };
  }

  return {
    continuityStatus: args.baseContinuityStatus ?? "warm",
    reason: "preserve_base_continuity"
  };
}

export function buildThreadStateAfterTurn(
  input: WriteThreadStateAfterTurnInput
): {
  thread_state: ThreadStateRecord;
  anchor_mode: "current_assistant_message" | "previous_assistant_message";
  focus_projection_reason: ThreadStateFocusProjectionReason;
  continuity_projection_reason: ThreadStateContinuityProjectionReason;
} | null {
  // Thread-state writeback is a deterministic projection of prepared context
  // plus the completed turn result. It should not introduce new turn-level
  // strategy or output decisions.
  const base = input.prepared.session.thread_state ?? null;
  const assistantMessage = input.result.assistant_message;
  const assistantMessageId = input.prepared.resources.assistant_message_id;
  const latestUserMessage = [...input.prepared.resources.messages]
    .reverse()
    .find((message) => message.role === "user");
  const recentRuntimeMessages = input.prepared.resources.messages.filter(
    (message) => message.status !== "failed" && message.status !== "pending"
  );

  if (!base) {
    return null;
  }

  if (!assistantMessage) {
    return null;
  }

  const nextFocusProjection = resolveThreadStateFocusMode({
    baseFocusMode: base.focus_mode ?? null,
    latestUserMessage: latestUserMessage?.content ?? null
  });
  const nextContinuityProjection = resolveThreadStateContinuityStatus({
    baseContinuityStatus: base.continuity_status ?? null,
    latestUserMessage: latestUserMessage?.content ?? null,
    hasPriorAssistantTurn:
      input.prepared.session.continuity_signals.hasPriorAssistantTurn,
    nextFocusMode: nextFocusProjection.focusMode,
    previousFocusMode: base.focus_mode ?? null
  });

  return {
    thread_state: {
      ...base,
      state_version: Math.max(1, base.state_version ?? 1) + 1,
      focus_mode: nextFocusProjection.focusMode,
      current_language_hint:
        assistantMessage.language === "zh"
          ? "zh-Hans"
          : assistantMessage.language === "en"
            ? "en"
            : base.current_language_hint ?? null,
      recent_turn_window_size: recentRuntimeMessages.length,
      continuity_status: nextContinuityProjection.continuityStatus,
      last_user_message_id:
        latestUserMessage?.id ?? base.last_user_message_id ?? null,
      last_assistant_message_id:
        assistantMessageId ?? base.last_assistant_message_id ?? null,
      updated_at: new Date().toISOString()
    },
    anchor_mode: assistantMessageId
      ? "current_assistant_message"
      : "previous_assistant_message",
    focus_projection_reason: nextFocusProjection.reason,
    continuity_projection_reason: nextContinuityProjection.reason
  };
}

export async function maybeWriteThreadStateAfterTurn(
  input: WriteThreadStateAfterTurnInput
): Promise<WriteThreadStateAfterTurnResult> {
  const repositoryName = input.repository_name ?? "unknown";
  const nextThreadState = buildThreadStateAfterTurn(input);

  if (!nextThreadState) {
    return {
      status: "skipped",
      repository: repositoryName,
      reason: "missing_thread_state_or_assistant_message"
    };
  }

  try {
    await input.repository.saveThreadState(nextThreadState.thread_state);
    return {
      status: "written",
      repository: repositoryName,
      thread_state: nextThreadState.thread_state,
      anchor_mode: nextThreadState.anchor_mode,
      focus_projection_reason: nextThreadState.focus_projection_reason,
      continuity_projection_reason: nextThreadState.continuity_projection_reason
    };
  } catch (error) {
    return {
      status: "failed",
      repository: repositoryName,
      reason:
        error instanceof Error ? error.message : "unknown_thread_state_write_error"
    };
  }
}
