import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnedWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attemptId = request.nextUrl.searchParams.get("attempt_id");
  if (!attemptId) {
    return NextResponse.json({ error: "Missing attempt_id" }, { status: 400 });
  }

  const attempt = await loadOwnedWeChatOpenILinkLoginAttempt({
    supabase,
    attemptId,
    userId: user.id
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    status: attempt.status,
    qrUrl: attempt.qr_url,
    errorMessage: attempt.error_message,
    botId: attempt.bot_id,
    wechatUserId: attempt.wechat_user_id,
    channelId: attempt.channel_id,
    peerId: attempt.peer_id,
    platformUserId: attempt.platform_user_id,
    connectedAt: attempt.connected_at,
    updatedAt: attempt.updated_at
  });
}
