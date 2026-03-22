import {
  buildInboundDedupeKey,
  buildRuntimeInputFromInbound,
  handleInboundChannelMessage
} from "./bridge";
import type {
  AdapterRuntimePort,
  ChannelBinding,
  InboundChannelMessage
} from "./contract";

export const exampleInboundMessage: InboundChannelMessage = {
  platform: "telegram",
  event_id: "evt_123",
  channel_id: "chat_123",
  peer_id: "peer_123",
  platform_user_id: "tg_user_123",
  message_id: "msg_123",
  message_type: "text",
  content: "今天有点乱，你能晚点提醒我继续吗？",
  timestamp: "2026-03-22T09:30:00.000Z",
  metadata: {
    locale: "zh-CN"
  }
};

export const exampleBinding: ChannelBinding = {
  platform: "telegram",
  channel_id: "chat_123",
  peer_id: "peer_123",
  platform_user_id: "tg_user_123",
  workspace_id: "workspace_123",
  user_id: "user_123",
  agent_id: "agent_123",
  thread_id: "thread_123",
  status: "active"
};

export const exampleRuntimePort: AdapterRuntimePort = {
  async runTurn(input) {
    return {
      assistant_message: {
        role: "assistant",
        content: `收到你的消息：${input.message}`,
        language: "zh-Hans",
        message_type: "text",
        metadata: {
          source: input.source
        }
      },
      memory_write_requests: [
        {
          memory_type: "preference",
          candidate_content: "用户偏好被温和提醒继续推进",
          reason: "supportive reminder preference inferred from inbound message",
          confidence: 0.72,
          source_turn_id: input.metadata.message_id as string,
          write_mode: "append"
        }
      ],
      follow_up_requests: [
        {
          kind: "gentle_check_in",
          trigger_at: "2026-03-22T11:30:00.000Z",
          reason: "user asked for a later reminder",
          payload: {
            thread_id: input.thread_id
          }
        }
      ],
      runtime_events: [
        {
          type: "assistant_reply_completed",
          payload: {
            source: input.source
          }
        }
      ],
      debug_metadata: {
        adapter_preview: true
      }
    };
  }
};

export const exampleRuntimeInput = buildRuntimeInputFromInbound({
  inbound: exampleInboundMessage,
  binding: exampleBinding
});

export const exampleInboundDedupeKey = buildInboundDedupeKey(exampleInboundMessage);

export async function buildExampleAdapterFlow() {
  return handleInboundChannelMessage({
    inbound: exampleInboundMessage,
    binding: exampleBinding,
    runtimePort: exampleRuntimePort,
    seenDedupeKeys: new Set<string>()
  });
}
