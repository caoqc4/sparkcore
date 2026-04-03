import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  readWeChatOpenILinkLoginAttempt
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

  const attempt = readWeChatOpenILinkLoginAttempt(attemptId);
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    status: attempt.status,
    qrUrl: attempt.qrUrl,
    errorMessage: attempt.errorMessage,
    botId: attempt.botId,
    wechatUserId: attempt.wechatUserId,
    channelId: attempt.channelId,
    peerId: attempt.peerId,
    platformUserId: attempt.platformUserId,
    connectedAt: attempt.connectedAt,
    updatedAt: attempt.updatedAt
  });
}
