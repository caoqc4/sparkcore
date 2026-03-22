import { NextResponse, type NextRequest } from "next/server";
import { runDefaultFollowUpWorker } from "@/lib/chat/default-follow-up-worker";
import { createAdminFollowUpBindingResolver } from "@/lib/chat/follow-up-binding";
import { StubProactiveSender } from "@/lib/chat/follow-up-proactive-sender";
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

    const result = await runDefaultFollowUpWorker({
      limit,
      claimedBy: payload.claimedBy?.trim() || "followup-test-route",
      sender: new StubProactiveSender(),
      resolveBinding: createAdminFollowUpBindingResolver({
        platform: payload.platform?.trim() || undefined
      })
    });

    return NextResponse.json({
      ok: true,
      sender: "stub",
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
