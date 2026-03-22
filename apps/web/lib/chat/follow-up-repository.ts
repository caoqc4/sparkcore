import type {
  EnqueuePendingFollowUpsInput,
  EnqueuePendingFollowUpsResult,
  FollowUpRepository,
  PendingFollowUpRecord,
  RuntimeFollowUpExecutionResult
} from "@/lib/chat/runtime-contract";

function isAcceptedFollowUpExecutionResult(
  result: RuntimeFollowUpExecutionResult
): result is RuntimeFollowUpExecutionResult & {
  status: "accepted";
  trigger_at: string;
  payload: Record<string, unknown>;
} {
  return (
    result.status === "accepted" &&
    typeof result.trigger_at === "string" &&
    result.trigger_at.length > 0 &&
    !!result.payload
  );
}

export function buildPendingFollowUpRecord({
  workspace_id,
  user_id,
  agent_id,
  thread_id,
  source_message_id,
  result
}: {
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  source_message_id?: string | null;
  result: RuntimeFollowUpExecutionResult;
}): PendingFollowUpRecord | null {
  if (!isAcceptedFollowUpExecutionResult(result)) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    kind: result.kind,
    status: "pending",
    trigger_at: result.trigger_at,
    workspace_id,
    user_id,
    agent_id,
    thread_id,
    request_payload: result.payload,
    request_reason: result.reason,
    source_message_id: source_message_id ?? null,
    source_request_index: result.request_index,
    created_at: now,
    updated_at: now
  };
}

export class InMemoryFollowUpRepository implements FollowUpRepository {
  private readonly records: PendingFollowUpRecord[] = [];

  async enqueuePendingFollowUps(
    input: EnqueuePendingFollowUpsInput
  ): Promise<EnqueuePendingFollowUpsResult> {
    const acceptedRecords = input.accepted_requests
      .map((result) =>
        buildPendingFollowUpRecord({
          workspace_id: input.workspace_id,
          user_id: input.user_id,
          agent_id: input.agent_id,
          thread_id: input.thread_id,
          source_message_id: input.source_message_id,
          result
        })
      )
      .filter((record): record is PendingFollowUpRecord => record !== null);

    this.records.push(...acceptedRecords);

    return {
      inserted_count: acceptedRecords.length,
      records: acceptedRecords,
      skipped_count: input.accepted_requests.length - acceptedRecords.length
    };
  }

  listRecords() {
    return [...this.records];
  }
}
