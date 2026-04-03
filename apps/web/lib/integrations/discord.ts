import type {
  InboundChannelMessage,
  OutboundChannelMessage
} from "@/lib/integrations/im-adapter";

const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordUser = {
  id: string;
  bot?: boolean;
  username?: string;
  global_name?: string | null;
};

export type DiscordMessageCreateEvent = {
  id: string;
  channel_id: string;
  guild_id?: string;
  content?: string;
  timestamp: string;
  author?: DiscordUser;
  type?: number;
};

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getDiscordApiBase() {
  return DISCORD_API_BASE;
}

export function isDiscordSelfMessage(event: DiscordMessageCreateEvent) {
  return event.author?.bot === true;
}

export function isDiscordDmMessageEvent(
  event: DiscordMessageCreateEvent | null | undefined
): event is DiscordMessageCreateEvent {
  if (!event || typeof event !== "object") {
    return false;
  }

  if (isDiscordSelfMessage(event)) {
    return false;
  }

  if (typeof event.guild_id === "string" && event.guild_id.length > 0) {
    return false;
  }

  if (typeof event.channel_id !== "string" || event.channel_id.length === 0) {
    return false;
  }

  if (typeof event.author?.id !== "string" || event.author.id.length === 0) {
    return false;
  }

  if (typeof event.timestamp !== "string" || event.timestamp.length === 0) {
    return false;
  }

  return getTrimmedString(event.content) !== null;
}

export function normalizeDiscordInboundMessage(
  event: DiscordMessageCreateEvent
): InboundChannelMessage | null {
  if (!isDiscordDmMessageEvent(event)) {
    return null;
  }

  const content = getTrimmedString(event.content);
  if (!content) {
    return null;
  }

  return {
    platform: "discord",
    event_id: event.id,
    channel_id: event.channel_id,
    peer_id: event.author!.id,
    platform_user_id: event.author!.id,
    message_id: event.id,
    message_type: "text",
    content,
    timestamp: event.timestamp,
    raw_event: event as unknown as Record<string, unknown>,
    metadata: {
      source: "discord_dm",
      author_username: event.author?.username ?? null,
      author_global_name: event.author?.global_name ?? null
    }
  };
}

async function sendDiscordTextMessage(args: {
  botToken: string;
  channelId: string;
  content: string;
}) {
  const response = await fetch(
    `${getDiscordApiBase()}/channels/${args.channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${args.botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: args.content
      })
    }
  );

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body
  };
}

export async function sendDiscordOutboundMessages(args: {
  botToken: string;
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
    if (message.platform !== "discord") {
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
      await sendDiscordTextMessage({
        botToken: args.botToken,
        channelId: message.channel_id,
        content
      })
    );
  }

  return results;
}
