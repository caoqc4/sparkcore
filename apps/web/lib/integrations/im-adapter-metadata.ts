import type { InboundChannelMessage } from "@/lib/integrations/im-adapter";

export function buildInboundRuntimeMetadata(
  inbound: InboundChannelMessage
) {
  return {
    platform: inbound.platform,
    channel_id: inbound.channel_id,
    peer_id: inbound.peer_id,
    platform_user_id: inbound.platform_user_id,
    message_id: inbound.message_id,
    event_id: inbound.event_id,
    message_type: inbound.message_type,
    attachments: inbound.attachments ?? [],
    inbound_metadata: inbound.metadata ?? {}
  };
}
