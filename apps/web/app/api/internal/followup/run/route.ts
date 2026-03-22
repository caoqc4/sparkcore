import { NextResponse, type NextRequest } from "next/server";
import { runDefaultFollowUpWorker } from "@/lib/chat/default-follow-up-worker";
import { createAdminFollowUpBindingResolver } from "@/lib/chat/follow-up-binding";
import { StubProactiveSender } from "@/lib/chat/follow-up-proactive-sender";
import { getFollowUpCronEnv } from "@/lib/env";
import { TelegramProactiveSender } from "@/lib/integrations/telegram-proactive-sender";

function isAuthorizedFollowUpCronRequest(request: NextRequest, secret: string) {
  return request.headers.get("x-followup-cron-secret") === secret;
}

export async function POST(request: NextRequest) {
  const config = getFollowUpCronEnv();

  if (!isAuthorizedFollowUpCronRequest(request, config.secret)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as {
      limit?: number;
      claimedBy?: string;
      platform?: string;
      sender?: "stub" | "telegram";
    };

    const limit =
      typeof payload.limit === "number" && Number.isFinite(payload.limit)
        ? payload.limit
        : 10;

    if (limit <= 0 || limit > 50) {
      return NextResponse.json(
        {
          ok: false,
          message: "limit must be between 1 and 50."
        },
        { status: 400 }
      );
    }

    const requestedSender = payload.sender ?? config.defaultSender;
    const sender =
      requestedSender === "telegram" && config.enableTelegramSend
        ? new TelegramProactiveSender()
        : new StubProactiveSender();

    const senderName =
      requestedSender === "telegram" && config.enableTelegramSend
        ? "telegram"
        : "stub";

    const result = await runDefaultFollowUpWorker({
      limit,
      claimedBy: payload.claimedBy?.trim() || "followup-cron-route",
      sender,
      resolveBinding: createAdminFollowUpBindingResolver({
        platform: payload.platform?.trim() || undefined
      })
    });

    return NextResponse.json({
      ok: true,
      sender: senderName,
      requested_sender: requestedSender,
      telegram_send_enabled: config.enableTelegramSend,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Follow-up cron execution failed."
      },
      { status: 500 }
    );
  }
}
