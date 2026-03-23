import type {
  ClaimDuePendingFollowUpsInput,
  ClaimDuePendingFollowUpsResult,
  EnqueuePendingFollowUpsInput,
  EnqueuePendingFollowUpsResult,
  FollowUpRepository,
  MarkFollowUpExecutedInput,
  MarkFollowUpExecutedResult,
  MarkFollowUpFailedInput,
  MarkFollowUpFailedResult,
  PendingFollowUpRecord,
  RuntimeFollowUpExecutionResult
} from "@/lib/chat/runtime-contract";
import { buildFollowUpClaimMetadata } from "@/lib/chat/follow-up-result-metadata";

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

  async claimDuePendingFollowUps(
    input: ClaimDuePendingFollowUpsInput
  ): Promise<ClaimDuePendingFollowUpsResult> {
    const claimableRecords = this.records
      .filter(
        (record) =>
          record.status === "pending" &&
          Date.parse(record.trigger_at) <= Date.parse(input.now)
      )
      .sort(
        (left, right) =>
          Date.parse(left.trigger_at) - Date.parse(right.trigger_at) ||
          Date.parse(left.created_at) - Date.parse(right.created_at)
      )
      .slice(0, input.limit);

    const claimToken = input.claim_token ?? crypto.randomUUID();
    const claimedAt = new Date().toISOString();

    const claimedIds = new Set(claimableRecords.map((record) => record.id));
    this.records.forEach((record) => {
      if (claimedIds.has(record.id)) {
        record.status = "claimed";
        record.updated_at = claimedAt;
        record.request_payload = {
          ...record.request_payload,
          ...buildFollowUpClaimMetadata({
            claimToken,
            claimedAt,
            claimedBy: input.claimed_by
          })
        };
      }
    });

    return {
      claimed_count: claimableRecords.length,
      records: this.records.filter((record) => claimedIds.has(record.id))
    };
  }

  async markFollowUpExecuted(
    input: MarkFollowUpExecutedInput
  ): Promise<MarkFollowUpExecutedResult> {
    const record = this.records.find((item) => item.id === input.id) ?? null;
    if (!record) {
      return {
        updated: false,
        record: null
      };
    }

    record.status = "executed";
    record.updated_at = input.executed_at;
    record.request_payload = {
      ...record.request_payload,
      execution_metadata: input.execution_metadata ?? {},
      executed_at: input.executed_at
    };

    return {
      updated: true,
      record: { ...record }
    };
  }

  async markFollowUpFailed(
    input: MarkFollowUpFailedInput
  ): Promise<MarkFollowUpFailedResult> {
    const record = this.records.find((item) => item.id === input.id) ?? null;
    if (!record) {
      return {
        updated: false,
        record: null
      };
    }

    record.status = "failed";
    record.updated_at = input.failed_at;
    record.request_payload = {
      ...record.request_payload,
      failed_at: input.failed_at,
      failure_reason: input.failure_reason,
      failure_metadata: input.failure_metadata ?? {}
    };

    return {
      updated: true,
      record: { ...record }
    };
  }

  listRecords() {
    return [...this.records];
  }
}

const defaultFollowUpRepository = new InMemoryFollowUpRepository();

export async function enqueueAcceptedFollowUps({
  workspace_id,
  user_id,
  agent_id,
  thread_id,
  source_message_id,
  execution_results,
  repository = defaultFollowUpRepository
}: {
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  source_message_id?: string | null;
  execution_results: RuntimeFollowUpExecutionResult[];
  repository?: FollowUpRepository;
}): Promise<EnqueuePendingFollowUpsResult> {
  return repository.enqueuePendingFollowUps({
    workspace_id,
    user_id,
    agent_id,
    thread_id,
    source_message_id,
    accepted_requests: execution_results.filter(
      (result): result is RuntimeFollowUpExecutionResult & { status: "accepted" } =>
        result.status === "accepted"
    )
  });
}
