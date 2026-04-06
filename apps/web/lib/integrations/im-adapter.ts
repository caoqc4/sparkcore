import type { RuntimeEvent } from "@/lib/chat/runtime-contract";
import {
  buildBindingNotFoundMetadata,
  buildProactiveOutboundMetadata,
  buildReplyOutboundMetadata
} from "@/lib/chat/follow-up-proactive-metadata";
import { buildInboundRuntimeMetadata } from "@/lib/integrations/im-adapter-metadata";

export type ChannelMessageType = "text" | "image" | "attachment";

export type ChannelSendMode = "reply" | "proactive";

export type InboundChannelAttachment = {
  kind: "image" | "file" | "audio";
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
  kind: "image" | "file" | "audio";
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

export type ProactiveSendTarget = {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id?: string;
  binding_id?: string;
};

export type ProactiveSendMessage = {
  message_type: ChannelMessageType;
  content: string;
  metadata?: Record<string, unknown>;
};

export type ProactiveSendRequest = {
  follow_up_id: string;
  kind: string;
  target: ProactiveSendTarget;
  message: ProactiveSendMessage;
  claim_token?: string;
  trace_id?: string;
};

export type ProactiveSendResultStatus =
  | "sent"
  | "failed"
  | "unsupported"
  | "invalid";

export type ProactiveSendResult = {
  follow_up_id: string;
  status: ProactiveSendResultStatus;
  platform_message_id?: string;
  failure_reason?: string;
  metadata?: Record<string, unknown>;
};

export type ProactiveSender = {
  send: (request: ProactiveSendRequest) => Promise<ProactiveSendResult>;
};

export type ChannelBinding = {
  id?: string;
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  character_channel_slug?: string | null;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id?: string | null;
  status: "active" | "inactive" | "invalid";
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

export type BindingLookupInput = {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  character_channel_slug?: string | null;
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

export type AdapterRuntimeEvent = RuntimeEvent;

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
  immediate_artifacts?: Array<Record<string, unknown>>;
  deferred_post_processing?: {
    assistant_message_id: string;
    source_message_id: string;
    agent_id: string;
    thread_id: string;
    workspace_id: string;
    user_id: string;
    active_memory_namespace?: Record<string, unknown> | null;
  } | null;
  deferred_artifact_generation?: {
    assistant_message_id: string;
    source_message_id: string;
    agent_id: string;
    thread_id: string;
    workspace_id: string;
    user_id: string;
    user_message: string;
    assistant_reply: string;
    agent_name: string | null;
    persona_summary: string;
    pre_generated_image_artifact?: Record<string, unknown> | null;
    audio_transcript_override?: string | null;
    explicit_image_requested?: boolean;
    explicit_audio_requested?: boolean;
    delivery_gate?: {
      clarify_before_action: boolean;
      reason: string | null;
      conflict_hint: string | null;
    } | null;
    image_artifact_action?: "allow" | "defer" | "block" | null;
    audio_artifact_action?: "allow" | "defer" | "block" | null;
  } | null;
  debug_metadata?: Record<string, unknown>;
};

export type AdapterDeferredPostProcessingPayload = Pick<
  AdapterRuntimeOutput,
  "memory_write_requests" | "follow_up_requests"
> &
  Partial<
    Pick<AdapterRuntimeOutput, "deferred_post_processing" | "debug_metadata">
  >;

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
  id?: string;
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  character_channel_slug?: string | null;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id?: string | null;
  status: "active" | "inactive" | "invalid";
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown> | null;
};

export function mapBindingRowToChannelBinding(row: BindingRow): ChannelBinding {
  return {
    id: row.id,
    platform: row.platform,
    channel_id: row.channel_id,
    peer_id: row.peer_id,
    platform_user_id: row.platform_user_id,
    character_channel_slug: row.character_channel_slug ?? null,
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

function isValidBindingIdentityValue(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== "undefined" &&
    trimmed !== "null"
  );
}

function isRuntimeUsableChannelBinding(row: BindingRow) {
  return (
    isValidBindingIdentityValue(row.workspace_id) &&
    isValidBindingIdentityValue(row.user_id) &&
    isValidBindingIdentityValue(row.agent_id) &&
    isValidBindingIdentityValue(row.thread_id ?? null)
  );
}

export class SupabaseBindingRepository implements BindingRepository {
  constructor(
    private readonly supabase: any,
    private readonly tableName: string = DEFAULT_BINDING_TABLE
  ) {}

  async findActiveBinding(
    input: BindingLookupInput
  ): Promise<ChannelBinding | null> {
    const query =
      typeof input.character_channel_slug !== "string"
        ? this.supabase
            .from(this.tableName)
            .select(
              "id, platform, channel_id, peer_id, platform_user_id, character_channel_slug, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
            )
            .eq("platform", input.platform)
            .eq("channel_id", input.channel_id)
            .eq("peer_id", input.peer_id)
            .eq("platform_user_id", input.platform_user_id)
            .eq("status", "active")
            .order("updated_at", { ascending: false })
            .limit(20)
        : this.supabase
            .from(this.tableName)
            .select(
              "id, platform, channel_id, peer_id, platform_user_id, character_channel_slug, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
            )
            .eq("platform", input.platform)
            .eq("channel_id", input.channel_id)
            .eq("peer_id", input.peer_id)
            .eq("platform_user_id", input.platform_user_id)
            .eq("character_channel_slug", input.character_channel_slug)
            .eq("status", "active")
            .order("updated_at", { ascending: false })
            .limit(20);

    const { data, error } = await query;
    if (error) {
      throw new Error(
        `Failed to load channel binding from ${this.tableName}: ${error.message}`
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const validRow = (data as BindingRow[]).find(isRuntimeUsableChannelBinding);

    if (!validRow) {
      return null;
    }

    return mapBindingRowToChannelBinding(validRow);
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
  character_channel_slug?: string | null;
}): BindingLookupInput {
  return {
    platform: args.platform,
    channel_id: args.channel_id,
    peer_id: args.peer_id,
    platform_user_id: args.platform_user_id,
    character_channel_slug: args.character_channel_slug
  };
}

export function buildInboundDedupeKey(message: InboundChannelMessage) {
  if (message.event_id.trim().length > 0) {
    return `${message.platform}:${message.event_id}`;
  }

  return `${message.platform}:${message.message_id}:${message.timestamp}`;
}

function getInboundCharacterChannelSlug(inbound: InboundChannelMessage) {
  if (!inbound.metadata || typeof inbound.metadata !== "object" || Array.isArray(inbound.metadata)) {
    return undefined;
  }

  return typeof inbound.metadata.character_channel_slug === "string"
    ? inbound.metadata.character_channel_slug
    : undefined;
}

export function buildRuntimeInputFromInbound(args: {
  inbound: InboundChannelMessage;
  binding: ChannelBinding;
}): AdapterRuntimeInput {
  const { inbound, binding } = args;

  const invalidField = (
    [
      ["binding.user_id", binding.user_id],
      ["binding.agent_id", binding.agent_id],
      ["binding.thread_id", binding.thread_id],
      ["binding.workspace_id", binding.workspace_id]
    ] as const
  ).find(([, value]) => {
    if (typeof value !== "string") {
      return true;
    }

    const trimmed = value.trim();
    return (
      trimmed.length === 0 ||
      trimmed === "undefined" ||
      trimmed === "null"
    );
  });

  if (invalidField) {
    const [fieldName, fieldValue] = invalidField;
    throw new Error(
      `Invalid active channel binding field ${fieldName} for binding ${binding.id ?? "unknown"}: ${String(fieldValue)}`
    );
  }

  return {
    user_id: binding.user_id.trim(),
    agent_id: binding.agent_id.trim(),
    thread_id: binding.thread_id!.trim(),
    message: inbound.content,
    message_type: inbound.message_type,
    source: "im",
    timestamp: inbound.timestamp,
    metadata: buildInboundRuntimeMetadata(inbound)
  };
}

export function buildProactiveSendTargetFromBinding(
  binding: ChannelBinding
): ProactiveSendTarget {
  return {
    platform: binding.platform,
    channel_id: binding.channel_id,
    peer_id: binding.peer_id,
    platform_user_id: binding.platform_user_id,
    binding_id: binding.id
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

  const runtimeMetadata =
    assistantMessage.metadata &&
    typeof assistantMessage.metadata === "object" &&
    !Array.isArray(assistantMessage.metadata)
      ? (assistantMessage.metadata as Record<string, unknown>)
      : {};
  const artifacts = Array.isArray(runtimeMetadata.artifacts)
    ? runtimeMetadata.artifacts.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item)
      )
    : [];

  const replyMetadata = buildReplyOutboundMetadata({
    language: assistantMessage.language ?? null,
    messageMetadata: assistantMessage.metadata ?? {}
  });
  const textChunks =
    assistantMessage.message_type === "text"
      ? assistantMessage.content
          .split(/\n{2,}/)
          .map((chunk) => chunk.trim())
          .filter((chunk) => chunk.length > 0)
      : [assistantMessage.content];
  const shouldSplitTextReply =
    assistantMessage.message_type === "text" &&
    textChunks.length === 2 &&
    textChunks[0].length <= 40 &&
    textChunks[1].length <= 160;

  const outboundMessages: OutboundChannelMessage[] = (shouldSplitTextReply
    ? textChunks
    : [assistantMessage.content]
  ).map((content) => ({
    platform: args.inbound.platform,
    channel_id: args.inbound.channel_id,
    peer_id: args.inbound.peer_id,
    message_type: assistantMessage.message_type,
    content,
    send_mode: "reply",
    metadata: replyMetadata
  }));

  for (const artifact of artifacts) {
    if (artifact.status !== "ready") {
      continue;
    }

    if (artifact.type === "image" && typeof artifact.url === "string" && artifact.url.length > 0) {
      outboundMessages.push({
        platform: args.inbound.platform,
        channel_id: args.inbound.channel_id,
        peer_id: args.inbound.peer_id,
        message_type: "image",
        content: "",
        attachments: [
          {
            kind: "image",
            url: artifact.url,
            metadata: {
              alt: typeof artifact.alt === "string" ? artifact.alt : null,
              model_slug: typeof artifact.modelSlug === "string" ? artifact.modelSlug : null,
              artifact_type: "assistant_image"
            }
          }
        ],
        send_mode: "reply",
        metadata: {
          delivery_hint: "assistant_artifact"
        }
      });
    }

    if (artifact.type === "audio" && typeof artifact.url === "string" && artifact.url.length > 0) {
      outboundMessages.push({
        platform: args.inbound.platform,
        channel_id: args.inbound.channel_id,
        peer_id: args.inbound.peer_id,
        message_type: "attachment",
        content: "",
        attachments: [
          {
            kind: "audio",
            url: artifact.url,
            metadata: {
              content_type:
                typeof artifact.contentType === "string" ? artifact.contentType : null,
              transcript:
                typeof artifact.transcript === "string" ? artifact.transcript : null,
              provider: typeof artifact.provider === "string" ? artifact.provider : null,
              artifact_type: "assistant_audio"
            }
          }
        ],
        send_mode: "reply",
        metadata: {
          delivery_hint: "assistant_artifact"
        }
      });
    }
  }

  return outboundMessages;
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
    metadata: buildProactiveOutboundMetadata({
      kind: request.kind,
      triggerAt: request.trigger_at,
      reason: request.reason,
      payload: request.payload ?? {}
    })
  }));
}

export function buildBindingNotFoundOutboundMessage(args: {
  inbound: InboundChannelMessage;
  reason?: string;
}): OutboundChannelMessage[] {
  const contentLines =
    args.inbound.platform === "discord"
      ? [
          "This Discord DM is not bound to a Lagun role yet.",
          "Open the Lagun connect flow, then paste these values:",
          `DM Channel ID: ${args.inbound.channel_id}`,
          `Discord User ID: ${args.inbound.peer_id}`,
          "After saving the binding, send your message again."
        ]
      : args.inbound.platform === "telegram"
        ? [
            "This Telegram chat is not bound to a Lagun role yet.",
            "Open the Lagun connect flow, then paste these values:",
            `Chat ID: ${args.inbound.channel_id}`,
            `User ID: ${args.inbound.peer_id}`,
            "After saving the binding, send your message again."
          ]
        : args.inbound.platform === "wechat"
          ? [
              "This WeChat chat is not bound to a Lagun role yet.",
              "Open the Lagun connect flow, then paste these values:",
              `WeChat Session ID: ${args.inbound.channel_id}`,
              `WeChat User ID: ${args.inbound.peer_id}`,
              "After saving the binding, send your message again."
            ]
        : args.inbound.platform === "feishu"
          ? [
              "This Feishu chat is not bound to a Lagun role yet.",
              "Open the Lagun connect flow, then paste these values:",
              `Feishu Chat ID: ${args.inbound.channel_id}`,
              `Feishu Open ID: ${args.inbound.peer_id}`,
              "After saving the binding, send your message again."
            ]
        : [
            "This channel is not bound to a Lagun role yet.",
            "Open the Lagun connect flow, then paste these values:",
            `channel_id: ${args.inbound.channel_id}`,
            `peer_id: ${args.inbound.peer_id}`,
            `platform_user_id: ${args.inbound.platform_user_id}`,
            "After saving the binding, send your message again."
          ];

  return [
    {
      platform: args.inbound.platform,
      channel_id: args.inbound.channel_id,
      peer_id: args.inbound.peer_id,
      message_type: "text",
      content: contentLines.join("\n"),
      send_mode: "reply",
      metadata: buildBindingNotFoundMetadata({
        reason: args.reason ?? null
      })
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
    platform_user_id: args.inbound.platform_user_id,
    character_channel_slug: getInboundCharacterChannelSlug(args.inbound)
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
  console.info("[im-adapter:binding-found]", {
    binding_id: lookupResult.binding.id ?? null,
    platform: lookupResult.binding.platform,
    channel_id: lookupResult.binding.channel_id,
    peer_id: lookupResult.binding.peer_id,
    platform_user_id: lookupResult.binding.platform_user_id,
    character_channel_slug: lookupResult.binding.character_channel_slug ?? null,
    workspace_id: lookupResult.binding.workspace_id,
    user_id: lookupResult.binding.user_id,
    agent_id: lookupResult.binding.agent_id,
    thread_id: lookupResult.binding.thread_id ?? null,
    runtime_user_id: runtimeInput.user_id,
    dedupe_key: dedupeKey
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
