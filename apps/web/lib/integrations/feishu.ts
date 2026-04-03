import * as Lark from "@larksuiteoapi/node-sdk";
import { getFeishuEnv } from "@/lib/env";
import type {
  InboundChannelMessage,
  OutboundChannelMessage
} from "@/lib/integrations/im-adapter";

export type FeishuMessageReceiveEvent = {
  sender?: {
    sender_id?: {
      open_id?: string;
    };
    sender_type?: string;
  };
  message?: {
    message_id?: string;
    chat_id?: string;
    chat_type?: string;
    message_type?: string;
    content?: string;
    create_time?: string;
  };
};

let feishuClient: Lark.Client | null = null;

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseFeishuTextContent(content: string | undefined) {
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as { text?: unknown };
    return getTrimmedString(parsed.text);
  } catch {
    return null;
  }
}

export function getFeishuClient() {
  if (feishuClient) {
    return feishuClient;
  }

  const { appId, appSecret } = getFeishuEnv();

  feishuClient = new Lark.Client({
    appId,
    appSecret,
    appType: Lark.AppType.SelfBuild,
    domain: Lark.Domain.Feishu
  });

  return feishuClient;
}

export function isFeishuP2pMessageEvent(
  event: FeishuMessageReceiveEvent | null | undefined
): event is FeishuMessageReceiveEvent {
  if (!event || typeof event !== "object") {
    return false;
  }

  if (getTrimmedString(event.message?.chat_id) === null) {
    return false;
  }

  if (getTrimmedString(event.sender?.sender_id?.open_id) === null) {
    return false;
  }

  if (event.message?.chat_type !== "p2p") {
    return false;
  }

  if (event.message?.message_type !== "text") {
    return false;
  }

  return parseFeishuTextContent(event.message?.content) !== null;
}

export function normalizeFeishuInboundMessage(
  event: FeishuMessageReceiveEvent
): InboundChannelMessage | null {
  if (!isFeishuP2pMessageEvent(event)) {
    return null;
  }

  const content = parseFeishuTextContent(event.message?.content);

  if (!content) {
    return null;
  }

  const chatId = event.message?.chat_id as string;
  const openId = event.sender?.sender_id?.open_id as string;
  const messageId = event.message?.message_id ?? `${chatId}:${event.message?.create_time ?? Date.now()}`;
  const timestamp = event.message?.create_time
    ? new Date(Number(event.message.create_time)).toISOString()
    : new Date().toISOString();

  return {
    platform: "feishu",
    event_id: messageId,
    channel_id: chatId,
    peer_id: openId,
    platform_user_id: openId,
    message_id: messageId,
    message_type: "text",
    content,
    timestamp,
    raw_event: event as unknown as Record<string, unknown>,
    metadata: {
      source: "feishu_p2p"
    }
  };
}

async function sendFeishuTextMessage(args: {
  channelId: string;
  content: string;
}) {
  const client = getFeishuClient();
  const response = await client.im.message.create({
    params: {
      receive_id_type: "chat_id"
    },
    data: {
      receive_id: args.channelId,
      msg_type: "text",
      content: JSON.stringify({
        text: args.content
      })
    }
  });

  return {
    ok: response.code === 0,
    status: response.code ?? 0,
    body: response
  };
}

export async function sendFeishuOutboundMessages(args: {
  messages: OutboundChannelMessage[];
}) {
  const results: Array<{
    ok: boolean;
    status: number;
    body: unknown;
    skipped?: boolean;
    reason?: string;
  }> = [];

  for (const message of args.messages) {
    if (message.platform !== "feishu") {
      results.push({
        ok: false,
        status: 0,
        body: null,
        skipped: true,
        reason: "unsupported_platform"
      });
      continue;
    }

    if (message.message_type !== "text") {
      results.push({
        ok: false,
        status: 0,
        body: null,
        skipped: true,
        reason: "unsupported_message_type"
      });
      continue;
    }

    const content = getTrimmedString(message.content);

    if (!content) {
      results.push({
        ok: false,
        status: 0,
        body: null,
        skipped: true,
        reason: "empty_content"
      });
      continue;
    }

    results.push(
      await sendFeishuTextMessage({
        channelId: message.channel_id,
        content
      })
    );
  }

  return results;
}

export { Lark };
