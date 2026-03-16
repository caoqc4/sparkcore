import { NextResponse, type NextRequest } from "next/server";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest,
  resetSmokeState
} from "@/lib/testing/smoke";

export async function POST(request: NextRequest) {
  const config = getSmokeConfig();

  if (!isAuthorizedSmokeRequest(request, config)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const result = await resetSmokeState();

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Smoke reset failed."
      },
      { status: 500 }
    );
  }
}
