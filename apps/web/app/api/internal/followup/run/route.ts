import { NextResponse, type NextRequest } from "next/server";
import { runDefaultFollowUpWorker } from "@/lib/chat/default-follow-up-worker";
import { createAdminFollowUpBindingResolver } from "@/lib/chat/follow-up-binding";
import {
  resolveFollowUpSender,
  type FollowUpSenderKind
} from "@/lib/chat/follow-up-sender-policy";
import { getFollowUpCronEnv } from "@/lib/env";

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
      sender?: FollowUpSenderKind;
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

    const senderPolicy = resolveFollowUpSender({
      routeKind: "internal",
      requestedSender: payload.sender,
      defaultSender: config.defaultSender,
      enableTelegramSend: config.enableTelegramSend
    });

    const result = await runDefaultFollowUpWorker({
      limit,
      claimedBy: payload.claimedBy?.trim() || "followup-cron-route",
      sender: senderPolicy.sender,
      resolveBinding: createAdminFollowUpBindingResolver({
        platform: payload.platform?.trim() || undefined
      })
    });

    return NextResponse.json({
      ok: true,
      sender: senderPolicy.senderKind,
      requested_sender: senderPolicy.requestedSender,
      telegram_send_enabled: senderPolicy.telegramSendEnabled,
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
