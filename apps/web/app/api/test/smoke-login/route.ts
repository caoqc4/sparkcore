import { NextResponse, type NextRequest } from "next/server";
import {
  createSmokeLoginResponse,
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke";

function getRedirectPath(request: NextRequest) {
  const requestedRedirect = request.nextUrl.searchParams.get("redirect");

  if (!requestedRedirect || !requestedRedirect.startsWith("/")) {
    return "/chat";
  }

  return requestedRedirect;
}

export async function GET(request: NextRequest) {
  const config = getSmokeConfig();

  if (!isAuthorizedSmokeRequest(request, config)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    return await createSmokeLoginResponse(request, getRedirectPath(request));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Smoke login failed."
      },
      { status: 500 }
    );
  }
}
