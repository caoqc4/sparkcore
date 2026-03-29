import { NextResponse, type NextRequest } from "next/server";
import {
  SupabaseBindingRepository,
  createSupabaseBindingLookup,
  handleInboundChannelMessage
} from "@/lib/integrations/im-adapter";
import { webImRuntimePort } from "@/lib/chat/im-runtime-port";
import {
  isTelegramInvalidDeliveryResponse,
  isValidTelegramWebhookSecret,
  normalizeTelegramUpdate,
  sendTelegramOutboundMessages,
  type TelegramUpdate
} from "@/lib/integrations/telegram";
import { getTelegramBotEnv } from "@/lib/env";
import { updateOwnedChannelBindingStatus } from "@/lib/product/channels";
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

    const admin = createAdminClient();
    const bindingLookup = await createSupabaseBindingLookup(admin);
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

    if (outboundDelivery.some(isTelegramInvalidDeliveryResponse)) {
      const repository = new SupabaseBindingRepository(admin);
      const binding = await repository.findActiveBinding({
        platform: inbound.platform,
        channel_id: inbound.channel_id,
        peer_id: inbound.peer_id,
        platform_user_id: inbound.platform_user_id
      });

      if (binding?.id) {
        const invalidResponse = outboundDelivery.find(isTelegramInvalidDeliveryResponse) ?? null;
        const invalidBody =
          invalidResponse?.body &&
          typeof invalidResponse.body === "object" &&
          !Array.isArray(invalidResponse.body)
            ? (invalidResponse.body as Record<string, unknown>)
            : null;

        await updateOwnedChannelBindingStatus({
          supabase: admin,
          bindingId: binding.id,
          userId: binding.user_id,
          status: "invalid",
          metadataPatch: {
            invalidated_at: new Date().toISOString(),
            invalidated_by: "telegram-webhook-outbound-delivery",
            invalid_reason:
              typeof invalidBody?.description === "string"
                ? invalidBody.description
                : "telegram_delivery_invalid",
            invalid_platform: inbound.platform
          }
        });
      }
    }

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
