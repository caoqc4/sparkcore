import type {
  Client,
  ClientConfig,
  LoginResult,
  WeixinMessage
} from "@openilink/openilink-sdk-node";
import type {
  InboundChannelMessage,
  OutboundChannelMessage
} from "@/lib/integrations/im-adapter";

export type WeChatOpenILinkSession = {
  botToken: string;
  baseUrl: string;
  botId?: string | null;
  userId?: string | null;
  syncBuf?: string | null;
  updatedAt?: string | null;
};

type OpenILinkModule = typeof import("@openilink/openilink-sdk-node");

let openILinkModulePromise: Promise<OpenILinkModule> | null = null;

async function loadOpenILinkModule() {
  if (!openILinkModulePromise) {
    openILinkModulePromise = import("@openilink/openilink-sdk-node");
  }

  return openILinkModulePromise;
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function createWeChatOpenILinkClient(
  session?: WeChatOpenILinkSession | null
): Promise<Client> {
  const { Client } = await loadOpenILinkModule();
  const config: ClientConfig | undefined = session
    ? {
        base_url: session.baseUrl
      }
    : undefined;

  return new Client(session?.botToken ?? "", config);
}

export function getWeChatLoginSessionFromResult(result: LoginResult) {
  if (!result.connected || !result.bot_token || !result.base_url) {
    return null;
  }

  return {
    botToken: result.bot_token,
    baseUrl: result.base_url,
    botId: result.bot_id ?? null,
    userId: result.user_id ?? null,
    syncBuf: null
  };
}

export function normalizeWeChatInboundMessage(
  message: WeixinMessage
): InboundChannelMessage | null {
  const fromUserId = getTrimmedString(message.from_user_id);
  const sessionId =
    getTrimmedString(message.session_id) ??
    getTrimmedString(message.from_user_id);
  const primaryText = Array.isArray(message.item_list)
    ? message.item_list
        .map((item) =>
          item?.type === 1 && item.text_item && typeof item.text_item.text === "string"
            ? item.text_item.text
            : null
        )
        .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    : null;
  const text = getTrimmedString(primaryText);

  if (!sessionId || !fromUserId || !text) {
    return null;
  }

  const eventId =
    (typeof message.message_id === "number" ? String(message.message_id) : null) ??
    `${sessionId}:${message.create_time_ms ?? Date.now()}`;

  return {
    platform: "wechat",
    event_id: eventId,
    channel_id: sessionId,
    peer_id: fromUserId,
    platform_user_id: fromUserId,
    message_id: eventId,
    message_type: "text",
    content: text,
    timestamp: new Date(message.create_time_ms ?? Date.now()).toISOString(),
    raw_event: message as unknown as Record<string, unknown>,
    metadata: {
      source: "wechat_openilink",
      session_id: getTrimmedString(message.session_id),
      normalized_channel_id: sessionId
    }
  };
}

export async function sendWeChatOutboundMessages(args: {
  client: Client;
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
    if (message.platform !== "wechat") {
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

    try {
      const messageId = await args.client.push(message.peer_id, content);
      results.push({
        ok: true,
        status: 200,
        body: {
          message_id: messageId
        }
      });
    } catch (error) {
      results.push({
        ok: false,
        status: 0,
        body: {
          error_message: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  return results;
}
