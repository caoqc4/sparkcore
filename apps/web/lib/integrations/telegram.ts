import type {
  InboundChannelMessage,
  OutboundChannelMessage
} from "@/lib/integrations/im-adapter";

type TelegramUser = {
  id: number;
};

type TelegramChat = {
  id: number;
};

type TelegramMessage = {
  message_id: number;
  date: number;
  text?: string;
  from?: TelegramUser;
  chat: TelegramChat;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

export function normalizeTelegramUpdate(
  update: TelegramUpdate
): InboundChannelMessage | null {
  const message = update.message;

  if (!message?.text || !message.from) {
    return null;
  }

  return {
    platform: "telegram",
    event_id: String(update.update_id),
    channel_id: String(message.chat.id),
    peer_id: String(message.from.id),
    platform_user_id: String(message.from.id),
    message_id: String(message.message_id),
    message_type: "text",
    content: message.text,
    timestamp: new Date(message.date * 1000).toISOString(),
    raw_event: update
  };
}

export function isValidTelegramWebhookSecret(args: {
  headerValue: string | null;
  configuredSecret: string | null;
}) {
  if (!args.configuredSecret) {
    return true;
  }

  return args.headerValue === args.configuredSecret;
}

export async function sendTelegramOutboundMessages(args: {
  botToken: string;
  messages: OutboundChannelMessage[];
}) {
  const responses: Array<{
    chat_id: string;
    ok: boolean;
    status: number;
    body: unknown;
  }> = [];

  for (const message of args.messages) {
    if (message.message_type !== "text") {
      responses.push({
        chat_id: message.channel_id,
        ok: false,
        status: 400,
        body: {
          error: "unsupported_message_type",
          message_type: message.message_type
        }
      });
      continue;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${args.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: message.channel_id,
          text: message.content
        })
      }
    );
    const body = await response.json().catch(() => null);

    responses.push({
      chat_id: message.channel_id,
      ok: response.ok,
      status: response.status,
      body
    });
  }

  return responses;
}
