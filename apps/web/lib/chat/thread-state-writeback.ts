import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { ThreadStateRepository } from "@/lib/chat/thread-state-repository";

export type WriteThreadStateAfterTurnInput = {
  prepared: PreparedRuntimeTurn;
  result: RuntimeTurnResult;
  repository: ThreadStateRepository;
  repository_name?: "supabase" | "in_memory" | "unknown";
};

export type WriteThreadStateAfterTurnResult =
  | {
      status: "written";
      repository: "supabase" | "in_memory" | "unknown";
      thread_state: ThreadStateRecord;
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

export function buildThreadStateAfterTurn(
  input: WriteThreadStateAfterTurnInput
): ThreadStateRecord | null {
  // Thread-state writeback is a deterministic projection of prepared context
  // plus the completed turn result. It should not introduce new turn-level
  // strategy or output decisions.
  const base = input.prepared.session.thread_state ?? null;
  const assistantMessage = input.result.assistant_message;
  const assistantMessageId = input.prepared.resources.assistant_message_id;
  const latestUserMessage = [...input.prepared.resources.messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!base) {
    return null;
  }

  if (!assistantMessage || !assistantMessageId) {
    return null;
  }

  return {
    ...base,
    current_language_hint:
      assistantMessage.language === "zh"
        ? "zh-Hans"
        : assistantMessage.language === "en"
          ? "en"
          : base.current_language_hint ?? null,
    continuity_status:
      input.prepared.session.continuity_signals.hasPriorAssistantTurn
        ? "engaged"
        : base.continuity_status ?? "warm",
    last_user_message_id: latestUserMessage?.id ?? base.last_user_message_id ?? null,
    last_assistant_message_id: assistantMessageId,
    updated_at: new Date().toISOString()
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
      reason: "missing_thread_state_or_assistant_anchor"
    };
  }

  try {
    await input.repository.saveThreadState(nextThreadState);
    return {
      status: "written",
      repository: repositoryName,
      thread_state: nextThreadState
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
