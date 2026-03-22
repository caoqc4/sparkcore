export type RuntimeAssistantMessage = {
  role: "assistant";
  content: string;
  language: string;
  message_type: "text";
  metadata?: Record<string, unknown>;
};

export type RuntimeGenericMemoryWriteRequest = {
  kind: "generic_memory";
  memory_type: "profile" | "preference";
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id: string;
  dedupe_key?: string;
  write_mode?: "upsert" | "append";
};

export type RuntimeRelationshipMemoryWriteRequest = {
  kind: "relationship_memory";
  memory_type: "relationship";
  relationship_key:
    | "agent_nickname"
    | "user_preferred_name"
    | "user_address_style";
  relationship_scope: "user_agent";
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id: string;
  target_agent_id: string;
  target_thread_id?: string | null;
  dedupe_key?: string;
  write_mode?: "upsert";
};

export type RuntimeMemoryWriteRequest =
  | RuntimeGenericMemoryWriteRequest
  | RuntimeRelationshipMemoryWriteRequest;

export type RuntimeFollowUpRequest = {
  kind: "gentle_check_in";
  trigger_at: string;
  reason: string;
  payload: Record<string, unknown>;
};

export type RuntimeFollowUpExecutionStatus =
  | "accepted"
  | "skipped"
  | "unsupported"
  | "invalid";

export type RuntimeFollowUpExecutionResult = {
  request_index: number;
  kind: string;
  status: RuntimeFollowUpExecutionStatus;
  reason: string;
  trigger_at?: string;
  payload?: Record<string, unknown>;
};

export type PendingFollowUpStatus =
  | "pending"
  | "claimed"
  | "executed"
  | "failed"
  | "skipped";

export type PendingFollowUpRecord = {
  id: string;
  kind: string;
  status: PendingFollowUpStatus;
  trigger_at: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  request_payload: Record<string, unknown>;
  request_reason: string;
  source_message_id?: string | null;
  source_request_index: number;
  created_at: string;
  updated_at: string;
};

export type EnqueuePendingFollowUpsInput = {
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id: string;
  accepted_requests: RuntimeFollowUpExecutionResult[];
  source_message_id?: string | null;
};

export type EnqueuePendingFollowUpsResult = {
  inserted_count: number;
  records: PendingFollowUpRecord[];
  skipped_count: number;
};

export type ClaimDuePendingFollowUpsInput = {
  now: string;
  limit: number;
  claimed_by: string;
  claim_token?: string;
};

export type ClaimDuePendingFollowUpsResult = {
  claimed_count: number;
  records: PendingFollowUpRecord[];
};

export type MarkFollowUpExecutedInput = {
  id: string;
  executed_at: string;
  execution_metadata?: Record<string, unknown>;
};

export type MarkFollowUpExecutedResult = {
  updated: boolean;
  record: PendingFollowUpRecord | null;
};

export type MarkFollowUpFailedInput = {
  id: string;
  failed_at: string;
  failure_reason: string;
  failure_metadata?: Record<string, unknown>;
};

export type MarkFollowUpFailedResult = {
  updated: boolean;
  record: PendingFollowUpRecord | null;
};

export type FollowUpRepository = {
  enqueuePendingFollowUps: (
    input: EnqueuePendingFollowUpsInput
  ) => Promise<EnqueuePendingFollowUpsResult>;
  claimDuePendingFollowUps: (
    input: ClaimDuePendingFollowUpsInput
  ) => Promise<ClaimDuePendingFollowUpsResult>;
  markFollowUpExecuted: (
    input: MarkFollowUpExecutedInput
  ) => Promise<MarkFollowUpExecutedResult>;
  markFollowUpFailed: (
    input: MarkFollowUpFailedInput
  ) => Promise<MarkFollowUpFailedResult>;
};

export type RuntimeEvent = {
  type:
    | "memory_recalled"
    | "memory_write_planned"
    | "follow_up_planned"
    | "answer_strategy_selected"
    | "assistant_reply_completed"
    | "thread_state_writeback_completed";
  payload?: Record<string, unknown>;
};

export type RuntimeTurnResult = {
  assistant_message: RuntimeAssistantMessage | null;
  memory_write_requests: RuntimeMemoryWriteRequest[];
  follow_up_requests: RuntimeFollowUpRequest[];
  runtime_events: RuntimeEvent[];
  debug_metadata?: Record<string, unknown>;
};
