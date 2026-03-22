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
      outbound_messages: OutboundChannelMessage[];
    }
  | {
      status: "processed";
      dedupe_key: string;
      runtime_input: AdapterRuntimeInput;
      runtime_output: AdapterRuntimeOutput;
      outbound_messages: OutboundChannelMessage[];
    };

export const DEFAULT_BINDING_TABLE = "channel_bindings";

export type BindingRow = {
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
  metadata?: Record<string, unknown> | null;
};

export function mapBindingRowToChannelBinding(row: BindingRow): ChannelBinding {
  return {
    platform: row.platform,
    channel_id: row.channel_id,
    peer_id: row.peer_id,
    platform_user_id: row.platform_user_id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    agent_id: row.agent_id,
    thread_id: row.thread_id ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata ?? undefined
  };
}

export class SupabaseBindingRepository implements BindingRepository {
  constructor(
    private readonly supabase: any,
    private readonly tableName: string = DEFAULT_BINDING_TABLE
  ) {}

  async findActiveBinding(
    input: BindingLookupInput
  ): Promise<ChannelBinding | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "platform, channel_id, peer_id, platform_user_id, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
      )
      .eq("platform", input.platform)
      .eq("channel_id", input.channel_id)
      .eq("peer_id", input.peer_id)
      .eq("platform_user_id", input.platform_user_id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load channel binding from ${this.tableName}: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return mapBindingRowToChannelBinding(data as BindingRow);
  }
}

export function createBindingLookupFromRepository(
  repository: BindingRepository
): BindingLookup {
  return {
    async lookup(input: BindingLookupInput): Promise<BindingLookupResult> {
      const binding = await repository.findActiveBinding(input);

      if (!binding) {
        return {
          status: "not_found",
          reason: "no active binding matched the inbound identity"
        };
      }

      return {
        status: "found",
        binding
      };
    }
  };
}

export function createSupabaseBindingLookup(
  supabase: any,
  tableName: string = DEFAULT_BINDING_TABLE
): BindingLookup {
  return createBindingLookupFromRepository(
    new SupabaseBindingRepository(supabase, tableName)
  );
}

export function buildBindingLookupInput(args: {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
}): BindingLookupInput {
  return {
    platform: args.platform,
    channel_id: args.channel_id,
    peer_id: args.peer_id,
    platform_user_id: args.platform_user_id
  };
}

export function buildInboundDedupeKey(message: InboundChannelMessage) {
  if (message.event_id.trim().length > 0) {
    return `${message.platform}:${message.event_id}`;
  }

  return `${message.platform}:${message.message_id}:${message.timestamp}`;
}

export function buildRuntimeInputFromInbound(args: {
  inbound: InboundChannelMessage;
  binding: ChannelBinding;
}): AdapterRuntimeInput {
  const { inbound, binding } = args;

  return {
    user_id: binding.user_id,
    agent_id: binding.agent_id,
    thread_id: binding.thread_id ?? "",
    message: inbound.content,
    message_type: inbound.message_type,
    source: "im",
    timestamp: inbound.timestamp,
    metadata: {
      platform: inbound.platform,
      channel_id: inbound.channel_id,
      peer_id: inbound.peer_id,
      platform_user_id: inbound.platform_user_id,
      message_id: inbound.message_id,
      event_id: inbound.event_id,
      inbound_metadata: inbound.metadata ?? {}
    }
  };
}

export function buildReplyOutboundMessage(args: {
  inbound: InboundChannelMessage;
  runtimeOutput: AdapterRuntimeOutput;
}): OutboundChannelMessage[] {
  const assistantMessage = args.runtimeOutput.assistant_message;

  if (!assistantMessage) {
    return [];
  }

  return [
    {
      platform: args.inbound.platform,
      channel_id: args.inbound.channel_id,
      peer_id: args.inbound.peer_id,
      message_type: assistantMessage.message_type,
      content: assistantMessage.content,
      send_mode: "reply",
      metadata: {
        runtime_message_language: assistantMessage.language ?? null,
        runtime_message_metadata: assistantMessage.metadata ?? {}
      }
    }
  ];
}

export function buildProactiveOutboundMessages(args: {
  binding: ChannelBinding;
  runtimeOutput: AdapterRuntimeOutput;
}): OutboundChannelMessage[] {
  return args.runtimeOutput.follow_up_requests.map((request) => ({
    platform: args.binding.platform,
    channel_id: args.binding.channel_id,
    peer_id: args.binding.peer_id,
    message_type: "text",
    content: "",
    send_mode: "proactive",
    metadata: {
      follow_up_kind: request.kind,
      follow_up_trigger_at: request.trigger_at,
      follow_up_reason: request.reason,
      follow_up_payload: request.payload ?? {}
    }
  }));
}

export function buildBindingNotFoundOutboundMessage(args: {
  inbound: InboundChannelMessage;
  reason?: string;
}): OutboundChannelMessage[] {
  return [
    {
      platform: args.inbound.platform,
      channel_id: args.inbound.channel_id,
      peer_id: args.inbound.peer_id,
      message_type: "text",
      content:
        "This channel is not bound to a SparkCore role yet. Complete the binding flow first, then try again.",
      send_mode: "reply",
      metadata: {
        binding_status: "not_found",
        binding_reason: args.reason ?? null
      }
    }
  ];
}

export async function handleInboundChannelMessage(args: {
  inbound: InboundChannelMessage;
  bindingLookup: BindingLookup;
  runtimePort: AdapterRuntimePort;
  seenDedupeKeys?: Set<string>;
}): Promise<AdapterInboundHandlingResult> {
  const dedupeKey = buildInboundDedupeKey(args.inbound);

  if (args.seenDedupeKeys?.has(dedupeKey)) {
    return {
      status: "skipped_duplicate",
      dedupe_key: dedupeKey
    };
  }

  const lookupInput = buildBindingLookupInput({
    platform: args.inbound.platform,
    channel_id: args.inbound.channel_id,
    peer_id: args.inbound.peer_id,
    platform_user_id: args.inbound.platform_user_id
  });
  const lookupResult = await args.bindingLookup.lookup(lookupInput);

  if (lookupResult.status === "not_found") {
    return {
      status: "binding_not_found",
      dedupe_key: dedupeKey,
      lookup_input: lookupInput,
      reason: lookupResult.reason,
      outbound_messages: buildBindingNotFoundOutboundMessage({
        inbound: args.inbound,
        reason: lookupResult.reason
      })
    };
  }

  const runtimeInput = buildRuntimeInputFromInbound({
    inbound: args.inbound,
    binding: lookupResult.binding
  });
  const runtimeOutput = await args.runtimePort.runTurn(runtimeInput);
  const outboundMessages = [
    ...buildReplyOutboundMessage({
      inbound: args.inbound,
      runtimeOutput
    }),
    ...buildProactiveOutboundMessages({
      binding: lookupResult.binding,
      runtimeOutput
    })
  ];

  args.seenDedupeKeys?.add(dedupeKey);

  return {
    status: "processed",
    dedupe_key: dedupeKey,
    runtime_input: runtimeInput,
    runtime_output: runtimeOutput,
    outbound_messages: outboundMessages
  };
}
