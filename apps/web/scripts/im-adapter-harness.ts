import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import {
  createSupabaseBindingLookup,
  handleInboundChannelMessage,
  type AdapterRuntimePort,
  type InboundChannelMessage
} from "../../../packages/integrations/im-adapter";

loadEnvConfig(process.cwd());

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getInboundMessageFromArgs(): InboundChannelMessage {
  const platform = getArgValue("--platform") ?? "telegram";
  const channelId = getArgValue("--channel-id") ?? "tg_chat_test_main";
  const peerId = getArgValue("--peer-id") ?? "tg_peer_test_main";
  const platformUserId =
    getArgValue("--platform-user-id") ?? "tg_user_test_main";
  const content =
    getArgValue("--message") ?? "今天状态有点乱，晚点提醒我继续。";
  const eventId = getArgValue("--event-id") ?? `evt_${Date.now()}`;
  const messageId = getArgValue("--message-id") ?? `msg_${Date.now()}`;

  return {
    platform,
    event_id: eventId,
    channel_id: channelId,
    peer_id: peerId,
    platform_user_id: platformUserId,
    message_id: messageId,
    message_type: "text",
    content,
    timestamp: new Date().toISOString(),
    metadata: {
      harness: true
    }
  };
}

const harnessRuntimePort: AdapterRuntimePort = {
  async runTurn(input) {
    return {
      assistant_message: {
        role: "assistant",
        content: `Harness reply: ${input.message}`,
        language: "zh-Hans",
        message_type: "text",
        metadata: {
          source: input.source,
          harness: true
        }
      },
      memory_write_requests: [
        {
          memory_type: "preference",
          candidate_content: "用户希望稍后被提醒继续当前事项",
          reason: "harness inferred a reminder preference from the inbound turn",
          confidence: 0.7,
          source_turn_id: input.metadata.message_id as string,
          write_mode: "append"
        }
      ],
      follow_up_requests: [
        {
          kind: "gentle_check_in",
          trigger_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          reason: "harness scheduled a one-hour follow-up",
          payload: {
            thread_id: input.thread_id
          }
        }
      ],
      runtime_events: [
        {
          type: "assistant_reply_completed",
          payload: {
            thread_id: input.thread_id,
            agent_id: input.agent_id,
            recalled_count: 0,
            message_type: "text",
            language: "zh"
          }
        }
      ],
      debug_metadata: {
        harness_runtime: true
      }
    };
  }
};

async function main() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const inbound = getInboundMessageFromArgs();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
  const bindingLookup = createSupabaseBindingLookup(supabase);
  const result = await handleInboundChannelMessage({
    inbound,
    bindingLookup,
    runtimePort: harnessRuntimePort,
    seenDedupeKeys: new Set<string>()
  });

  console.log(
    JSON.stringify(
      {
        inbound,
        result
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown harness failure.");
  process.exitCode = 1;
});
