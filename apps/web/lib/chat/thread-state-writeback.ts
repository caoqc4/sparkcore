import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import type { ThreadStateRepository } from "@/lib/chat/thread-state-repository";

export type WriteThreadStateAfterTurnInput = {
  prepared: PreparedRuntimeTurn;
  result: RuntimeTurnResult;
  repository: ThreadStateRepository;
};

export type WriteThreadStateAfterTurnResult =
  | {
      status: "written";
      thread_state: ThreadStateRecord;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      reason: string;
    };

export function buildThreadStateAfterTurn(
  input: WriteThreadStateAfterTurnInput
): ThreadStateRecord | null {
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
  const nextThreadState = buildThreadStateAfterTurn(input);

  if (!nextThreadState) {
    return {
      status: "skipped",
      reason: "missing_thread_state_or_assistant_anchor"
    };
  }

  try {
    await input.repository.saveThreadState(nextThreadState);
    return {
      status: "written",
      thread_state: nextThreadState
    };
  } catch (error) {
    return {
      status: "failed",
      reason:
        error instanceof Error ? error.message : "unknown_thread_state_write_error"
    };
  }
}
