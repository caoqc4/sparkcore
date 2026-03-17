import { NextResponse, type NextRequest } from "next/server";
import {
  createSmokeTurn,
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke";

export async function POST(request: NextRequest) {
  const config = getSmokeConfig();

  if (!isAuthorizedSmokeRequest(request, config)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const payload = (await request.json()) as {
      threadId?: string;
      content?: string;
    };
    const threadId = payload.threadId?.trim();
    const content = payload.content?.trim();

    if (!threadId || !content) {
      return NextResponse.json(
        {
          ok: false,
          message: "threadId and content are required."
        },
        { status: 400 }
      );
    }

    const result = await createSmokeTurn({ threadId, content });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Smoke turn creation failed."
      },
      { status: 500 }
    );
  }
}
