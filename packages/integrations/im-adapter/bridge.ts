import type {
  AdapterInboundHandlingResult,
  AdapterRuntimeInput,
  AdapterRuntimeOutput,
  AdapterRuntimePort,
  BindingLookup,
  ChannelBinding,
  InboundChannelMessage,
  OutboundChannelMessage
} from "./contract";
import { buildBindingLookupInput } from "./binding";

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

  const outboundMessages: OutboundChannelMessage[] = [
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
        attachments: [{ kind: "image", url: artifact.url }],
        send_mode: "reply",
        metadata: { delivery_hint: "assistant_artifact" }
      });
    }

    if (artifact.type === "audio" && typeof artifact.url === "string" && artifact.url.length > 0) {
      outboundMessages.push({
        platform: args.inbound.platform,
        channel_id: args.inbound.channel_id,
        peer_id: args.inbound.peer_id,
        message_type: "attachment",
        content: "",
        attachments: [{ kind: "audio", url: artifact.url }],
        send_mode: "reply",
        metadata: { delivery_hint: "assistant_artifact" }
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
