export type ChannelMessageType = "text" | "image" | "attachment";

export type ChannelSendMode = "reply" | "proactive";

export type InboundChannelAttachment = {
  kind: "image" | "file";
  url?: string;
  mime_type?: string;
  metadata?: Record<string, unknown>;
};

export type InboundChannelMessage = {
  platform: string;
  event_id: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  message_id: string;
  message_type: ChannelMessageType;
  content: string;
  attachments?: InboundChannelAttachment[];
  timestamp: string;
  raw_event?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type OutboundChannelAttachment = {
  kind: "image" | "file";
  url?: string;
  metadata?: Record<string, unknown>;
};

export type OutboundChannelMessage = {
  platform: string;
  channel_id: string;
  peer_id: string;
  message_type: ChannelMessageType;
  content: string;
  attachments?: OutboundChannelAttachment[];
  send_mode: ChannelSendMode;
  metadata?: Record<string, unknown>;
};

export type ChannelBinding = {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id?: string | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

export type BindingLookupInput = {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
};

export type BindingLookupResult =
  | {
      status: "found";
      binding: ChannelBinding;
    }
  | {
      status: "not_found";
      reason?: string;
    };

export type BindingLookup = {
  lookup: (input: BindingLookupInput) => Promise<BindingLookupResult>;
};

export type BindingRepository = {
  findActiveBinding: (input: BindingLookupInput) => Promise<ChannelBinding | null>;
};

export type AdapterRuntimeInput = {
  user_id: string;
  agent_id: string;
  thread_id: string;
  message: string;
  message_type: ChannelMessageType;
  source: "im";
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type AdapterRuntimeAssistantMessage = {
  role: "assistant";
  content: string;
  language?: string | null;
  message_type: ChannelMessageType;
  metadata?: Record<string, unknown>;
};

export type AdapterRuntimeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

export type AdapterMemoryWriteRequest = {
  memory_type: string;
  candidate_content: string;
  reason: string;
  confidence: number;
  source_turn_id?: string;
  dedupe_key?: string;
  write_mode?: "upsert" | "append";
};

export type AdapterFollowUpRequest = {
  kind: string;
  trigger_at: string;
  reason: string;
  payload?: Record<string, unknown>;
};

export type AdapterRuntimeOutput = {
  assistant_message: AdapterRuntimeAssistantMessage | null;
  memory_write_requests: AdapterMemoryWriteRequest[];
  follow_up_requests: AdapterFollowUpRequest[];
  runtime_events: AdapterRuntimeEvent[];
  debug_metadata?: Record<string, unknown>;
};

export type AdapterRuntimePort = {
  runTurn: (input: AdapterRuntimeInput) => Promise<AdapterRuntimeOutput>;
};

export type AdapterInboundHandlingResult =
  | {
      status: "skipped_duplicate";
      dedupe_key: string;
    }
  | {
      status: "binding_not_found";
      dedupe_key: string;
      lookup_input: BindingLookupInput;
      reason?: string;
    }
  | {
      status: "processed";
      dedupe_key: string;
      runtime_input: AdapterRuntimeInput;
      runtime_output: AdapterRuntimeOutput;
      outbound_messages: OutboundChannelMessage[];
    };
