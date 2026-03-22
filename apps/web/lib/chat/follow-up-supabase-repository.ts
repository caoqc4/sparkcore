import type {
  ClaimDuePendingFollowUpsInput,
  ClaimDuePendingFollowUpsResult,
  EnqueuePendingFollowUpsInput,
  EnqueuePendingFollowUpsResult,
  FollowUpRepository,
  PendingFollowUpRecord
} from "@/lib/chat/runtime-contract";
import { buildPendingFollowUpRecord } from "@/lib/chat/follow-up-repository";

export const DEFAULT_PENDING_FOLLOW_UPS_TABLE = "pending_follow_ups";

export type PendingFollowUpRow = {
  id: string;
  kind: string;
  status: PendingFollowUpRecord["status"];
  trigger_at: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  request_payload: Record<string, unknown> | null;
  request_reason: string;
  source_message_id?: string | null;
  source_request_index: number;
  created_at: string;
  updated_at: string;
};

export function mapPendingFollowUpRowToRecord(
  row: PendingFollowUpRow
): PendingFollowUpRecord {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    trigger_at: row.trigger_at,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    agent_id: row.agent_id,
    thread_id: row.thread_id,
    request_payload: row.request_payload ?? {},
    request_reason: row.request_reason,
    source_message_id: row.source_message_id ?? null,
    source_request_index: row.source_request_index,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export class SupabaseFollowUpRepository implements FollowUpRepository {
  constructor(
    private readonly supabase: any,
    private readonly tableName: string = DEFAULT_PENDING_FOLLOW_UPS_TABLE
  ) {}

  async enqueuePendingFollowUps(
    input: EnqueuePendingFollowUpsInput
  ): Promise<EnqueuePendingFollowUpsResult> {
    const rowsToInsert = input.accepted_requests
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
      .filter((record): record is PendingFollowUpRecord => record !== null)
      .map((record) => ({
        id: record.id,
        kind: record.kind,
        status: record.status,
        trigger_at: record.trigger_at,
        workspace_id: record.workspace_id,
        user_id: record.user_id,
        agent_id: record.agent_id,
        thread_id: record.thread_id,
        request_payload: record.request_payload,
        request_reason: record.request_reason,
        source_message_id: record.source_message_id ?? null,
        source_request_index: record.source_request_index,
        created_at: record.created_at,
        updated_at: record.updated_at
      }));

    if (rowsToInsert.length === 0) {
      return {
        inserted_count: 0,
        records: [],
        skipped_count: input.accepted_requests.length
      };
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(rowsToInsert)
      .select(
        "id, kind, status, trigger_at, workspace_id, user_id, agent_id, thread_id, request_payload, request_reason, source_message_id, source_request_index, created_at, updated_at"
      );

    if (error) {
      throw new Error(
        `Failed to enqueue pending follow-ups into ${this.tableName}: ${error.message}`
      );
    }

    const records = ((data ?? []) as PendingFollowUpRow[]).map(
      mapPendingFollowUpRowToRecord
    );

    return {
      inserted_count: records.length,
      records,
      skipped_count: input.accepted_requests.length - records.length
    };
  }

  async claimDuePendingFollowUps(
    input: ClaimDuePendingFollowUpsInput
  ): Promise<ClaimDuePendingFollowUpsResult> {
    const { data: dueRows, error: loadError } = await this.supabase
      .from(this.tableName)
      .select(
        "id, kind, status, trigger_at, workspace_id, user_id, agent_id, thread_id, request_payload, request_reason, source_message_id, source_request_index, created_at, updated_at"
      )
      .eq("status", "pending")
      .lte("trigger_at", input.now)
      .order("trigger_at", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(input.limit);

    if (loadError) {
      throw new Error(
        `Failed to load due pending follow-ups from ${this.tableName}: ${loadError.message}`
      );
    }

    const claimableRows = (dueRows ?? []) as PendingFollowUpRow[];
    if (claimableRows.length === 0) {
      return {
        claimed_count: 0,
        records: []
      };
    }

    const claimToken = input.claim_token ?? crypto.randomUUID();
    const claimedAt = new Date().toISOString();
    const ids = claimableRows.map((row) => row.id);

    const { data: claimedRows, error: claimError } = await this.supabase
      .from(this.tableName)
      .update({
        status: "claimed",
        metadata: {
          claim_token: claimToken,
          claimed_at: claimedAt,
          claimed_by: input.claimed_by
        },
        updated_at: claimedAt
      })
      .in("id", ids)
      .eq("status", "pending")
      .select(
        "id, kind, status, trigger_at, workspace_id, user_id, agent_id, thread_id, request_payload, request_reason, source_message_id, source_request_index, created_at, updated_at"
      );

    if (claimError) {
      throw new Error(
        `Failed to claim due pending follow-ups in ${this.tableName}: ${claimError.message}`
      );
    }

    const records = ((claimedRows ?? []) as PendingFollowUpRow[]).map(
      mapPendingFollowUpRowToRecord
    );

    return {
      claimed_count: records.length,
      records
    };
  }
}
