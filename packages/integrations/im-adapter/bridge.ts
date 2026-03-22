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
      reason: lookupResult.reason
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
