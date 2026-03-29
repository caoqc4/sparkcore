import { NextResponse, type NextRequest } from "next/server";
import { getKnowledgeProcessingEnv } from "@/lib/env";
import {
  processKnowledgeSourceById,
  processQueuedKnowledgeSources
} from "@/lib/product/knowledge-processing";

function isAuthorizedKnowledgeRequest(request: NextRequest, secret: string) {
  return request.headers.get("x-knowledge-processing-secret") === secret;
}

export async function POST(request: NextRequest) {
  const config = getKnowledgeProcessingEnv();

  if (!isAuthorizedKnowledgeRequest(request, config.secret)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as {
      sourceId?: string;
      limit?: number;
    };

    if (typeof payload.sourceId === "string" && payload.sourceId.trim().length > 0) {
      const result = await processKnowledgeSourceById(payload.sourceId.trim());
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    const limit =
      typeof payload.limit === "number" && Number.isFinite(payload.limit)
        ? payload.limit
        : 10;

    if (limit <= 0 || limit > 50) {
      return NextResponse.json(
        { ok: false, message: "limit must be between 1 and 50." },
        { status: 400 }
      );
    }

    const results = await processQueuedKnowledgeSources(limit);
    return NextResponse.json({
      ok: true,
      count: results.length,
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Knowledge processing failed."
      },
      { status: 500 }
    );
  }
}
