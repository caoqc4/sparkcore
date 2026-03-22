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

export type RuntimeEvent = {
  type:
    | "memory_recalled"
    | "memory_write_planned"
    | "follow_up_planned"
    | "answer_strategy_selected"
    | "assistant_reply_completed";
  payload?: Record<string, unknown>;
};

export type RuntimeTurnResult = {
  assistant_message: RuntimeAssistantMessage | null;
  memory_write_requests: RuntimeMemoryWriteRequest[];
  follow_up_requests: RuntimeFollowUpRequest[];
  runtime_events: RuntimeEvent[];
  debug_metadata?: Record<string, unknown>;
};
