import { NextResponse, type NextRequest } from "next/server";
import { runDefaultFollowUpWorker } from "@/lib/chat/default-follow-up-worker";
import { createAdminFollowUpBindingResolver } from "@/lib/chat/follow-up-binding";
import {
  resolveFollowUpSender,
  type FollowUpSenderKind
} from "@/lib/chat/follow-up-sender-policy";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke";

export async function POST(request: NextRequest) {
  const config = getSmokeConfig();

  if (!isAuthorizedSmokeRequest(request, config)) {
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

    if (limit <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "limit must be a positive number."
        },
        { status: 400 }
      );
    }

    const senderPolicy = resolveFollowUpSender({
      routeKind: "test",
      requestedSender: payload.sender,
      defaultSender: "stub",
      enableTelegramSend: false
    });

    const result = await runDefaultFollowUpWorker({
      limit,
      claimedBy: payload.claimedBy?.trim() || "followup-test-route",
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
          error instanceof Error ? error.message : "Follow-up worker execution failed."
      },
      { status: 500 }
    );
  }
}
