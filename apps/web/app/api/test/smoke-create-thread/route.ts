import { NextResponse, type NextRequest } from "next/server";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke-config";
import {
  createSmokeThread,
} from "@/lib/testing/smoke";

export async function POST(request: NextRequest) {
  const config = getSmokeConfig();

  if (!isAuthorizedSmokeRequest(request, config)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const payload = (await request.json()) as { agentName?: string };
    const agentName = payload.agentName?.trim();

    if (!agentName) {
      return NextResponse.json(
        { ok: false, message: "agentName is required." },
        { status: 400 }
      );
    }

    const result = await createSmokeThread({ agentName });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Smoke thread creation failed."
      },
      { status: 500 }
    );
  }
}
