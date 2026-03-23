import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseBindingLookup,
  handleInboundChannelMessage
} from "@/lib/integrations/im-adapter";
import { webImRuntimePort } from "@/lib/chat/im-runtime-port";
import {
  isValidTelegramWebhookSecret,
  normalizeTelegramUpdate,
  sendTelegramOutboundMessages,
  type TelegramUpdate
} from "@/lib/integrations/telegram";
import { getTelegramBotEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { botToken, webhookSecret } = getTelegramBotEnv();

  if (
    !isValidTelegramWebhookSecret({
      headerValue: request.headers.get("x-telegram-bot-api-secret-token"),
      configuredSecret: webhookSecret
    })
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    const inbound = normalizeTelegramUpdate(update);

    if (!inbound) {
      return NextResponse.json({
        ok: true,
        status: "ignored_non_text_update"
      });
    }

    const bindingLookup = await createSupabaseBindingLookup(createAdminClient());
    const result = await handleInboundChannelMessage({
      inbound,
      bindingLookup,
      runtimePort: webImRuntimePort
    });

    const outboundDelivery = "outbound_messages" in result
      ? await sendTelegramOutboundMessages({
          botToken,
          messages: result.outbound_messages
        })
      : [];

    return NextResponse.json({
      ok: true,
      status: result.status,
      dedupe_key: result.dedupe_key,
      outbound_count: "outbound_messages" in result ? result.outbound_messages.length : 0,
      delivery: outboundDelivery
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Telegram webhook handling failed."
      },
      { status: 500 }
    );
  }
}
