export type RuntimeAssistantMessage = {
  role: "assistant";
  content: string;
  language: string;
  message_type: "text";
  metadata?: Record<string, unknown>;
};

export type RuntimeMemoryWriteRequest = {
  memory_type: "profile" | "preference";
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id: string;
  dedupe_key?: string;
  write_mode?: "upsert" | "append";
};

export type RuntimeFollowUpRequest = {
  kind: "gentle_check_in";
  trigger_at: string;
  reason: string;
  payload: Record<string, unknown>;
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
