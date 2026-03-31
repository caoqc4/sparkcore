import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadThreadMessages } from "@/lib/chat/message-read";
import { loadOwnedThread, loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";

function normalizeThreadId(value: string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const threadId = normalizeThreadId(requestUrl.searchParams.get("threadId"));

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  const { data: messages, error } = await loadThreadMessages({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    messages: (messages ?? []).map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status,
      metadata:
        message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata)
          ? message.metadata
          : {},
      createdAt: message.created_at
    }))
  });
}
