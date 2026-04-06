import type { MessageRecord, ThreadRecord, WorkspaceRecord } from "@/lib/chat/runtime-chat-page-state";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import type { AgentRecord } from "@/lib/chat/role-core";
import type { RunAgentTurnArgs, ValidatedRuntimeTurnEntry } from "@/lib/chat/runtime-entry-contracts";

export function validateRuntimeTurnEntry(
  args: RunAgentTurnArgs
): ValidatedRuntimeTurnEntry {
  const {
    input,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId,
    supabase
  } = args;

  if (input.actor.user_id.trim().length === 0) {
    throw new Error("RuntimeTurnInput.actor.user_id is required.");
  }

  if (input.actor.agent_id !== agent.id) {
    throw new Error("RuntimeTurnInput.actor.agent_id does not match the loaded agent.");
  }

  if (input.actor.thread_id !== thread.id) {
    throw new Error("RuntimeTurnInput.actor.thread_id does not match the loaded thread.");
  }

  if (
    input.actor.workspace_id &&
    input.actor.workspace_id !== workspace.id
  ) {
    throw new Error(
      "RuntimeTurnInput.actor.workspace_id does not match the loaded workspace."
    );
  }

  const normalizedAssistantMessageId =
    typeof assistantMessageId === "string" &&
    assistantMessageId.trim().length > 0 &&
    assistantMessageId !== "undefined" &&
    assistantMessageId !== "null"
      ? assistantMessageId
      : undefined;

  return {
    userId: input.actor.user_id,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId: normalizedAssistantMessageId,
    runtimeTurnInput: input,
    supabase
  };
}
