import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-redirect";
import { loadScopedMessageById } from "@/lib/chat/message-read";
import { loadPrimaryWorkspace, loadOwnedThread } from "@/lib/chat/runtime-turn-context";
import { getTelegramBotConfig, getTelegramBotEnv } from "@/lib/env";
import { resolveTelegramFileDownloadResponse } from "@/lib/integrations/telegram";
import { isCharacterChannelSlug } from "@/lib/product/character-channels";
import { createClient } from "@/lib/supabase/server";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser("/chat");
  const url = new URL(request.url);
  const threadId = getString(url.searchParams.get("threadId"));
  const messageId = getString(url.searchParams.get("messageId"));
  const artifactId = getString(url.searchParams.get("artifactId"));

  if (!threadId || !messageId || !artifactId) {
    return NextResponse.json(
      { error: "threadId, messageId, and artifactId are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const { data: message } = await loadScopedMessageById({
    supabase,
    messageId,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    select: "id, metadata"
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const metadata = asRecord(message.metadata);
  const inboundMetadata = asRecord(metadata?.inbound_metadata);
  const inboundCharacterChannelSlug = getString(inboundMetadata?.character_channel_slug);
  const artifacts = Array.isArray(metadata?.artifacts) ? metadata.artifacts : [];
  const artifact =
    artifacts.find((item) => {
      const record = asRecord(item);
      return getString(record?.id) === artifactId;
    }) ?? null;

  const artifactRecord = asRecord(artifact);
  const telegramRecord = asRecord(artifactRecord?.telegram);
  const fileId = getString(telegramRecord?.telegram_file_id);

  if (!fileId) {
    return NextResponse.json({ error: "Telegram file metadata not found." }, { status: 404 });
  }

  const { botToken } =
    inboundCharacterChannelSlug && isCharacterChannelSlug(inboundCharacterChannelSlug)
      ? getTelegramBotConfig(inboundCharacterChannelSlug)
      : getTelegramBotEnv();

  try {
    const response = await resolveTelegramFileDownloadResponse({
      botToken,
      fileId
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: `Telegram file download failed with status ${response.status}.` },
        { status: 502 }
      );
    }

    return new NextResponse(response.body, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type":
          response.headers.get("Content-Type") ??
          getString(artifactRecord?.mimeType) ??
          "application/octet-stream"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Telegram file download failed."
      },
      { status: 502 }
    );
  }
}
