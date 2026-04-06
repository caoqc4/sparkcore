import {
  createWeChatOpenILinkClient,
  getWeChatLoginSessionFromResult
} from "@/lib/integrations/wechat-openilink";
import {
  loadWeChatOpenILinkLoginAttemptById,
  updateWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";
import {
  startWeChatOpenILinkWorkerWithClient
} from "@/lib/integrations/wechat-openilink-worker";
import {
  upsertActiveWeChatOpenILinkSession,
  updateWeChatOpenILinkSessionRuntimeState
} from "@/lib/integrations/wechat-openilink-sessions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runWeChatOpenILinkLoginAttempt(attemptId: string) {
  const admin = createAdminClient();
  const attempt = await loadWeChatOpenILinkLoginAttemptById({
    supabase: admin,
    attemptId
  });

  if (!attempt) {
    throw new Error("WeChat login attempt not found.");
  }

  const client = await createWeChatOpenILinkClient(null);

  const result = await client.loginWithQr({
    on_qrcode: (img: string) => {
      void updateWeChatOpenILinkLoginAttempt({
        supabase: admin,
        attemptId,
        patch: {
          status: "qr_ready",
          qr_url: img,
          error_message: null
        }
      });
    },
    on_scanned: () => {
      void updateWeChatOpenILinkLoginAttempt({
        supabase: admin,
        attemptId,
        patch: {
          status: "scanned",
          error_message: null
        }
      });
    },
    on_expired: () => {
      void updateWeChatOpenILinkLoginAttempt({
        supabase: admin,
        attemptId,
        patch: {
          status: "starting"
        }
      });
    }
  });

  const session = getWeChatLoginSessionFromResult(result);

  if (!session) {
    await updateWeChatOpenILinkLoginAttempt({
      supabase: admin,
      attemptId,
      patch: {
        status: "error",
        error_message: result.message || "WeChat login failed."
      }
    });
    throw new Error(result.message || "WeChat login failed.");
  }

  const storedSession = await upsertActiveWeChatOpenILinkSession({
    supabase: admin,
    workspaceId: attempt.workspace_id,
    userId: attempt.user_id,
    session,
    status: "pending",
    metadata: {
      attempt_id: attempt.id
    }
  });

  await updateWeChatOpenILinkLoginAttempt({
    supabase: admin,
    attemptId,
    patch: {
      status: "connected",
      qr_url: null,
      error_message: null,
      bot_id: session.botId ?? null,
      wechat_user_id: session.userId ?? null,
      connected_at: new Date().toISOString()
    }
  });

  await startWeChatOpenILinkWorkerWithClient({
    client,
    session,
    logger: console,
    onSyncBufUpdate: async (buf) => {
      await updateWeChatOpenILinkSessionRuntimeState({
        supabase: admin,
        sessionId: storedSession.id,
        syncBuf: buf,
        lastSeenAt: new Date().toISOString()
      });
    },
    onSessionActivity: async () => {
      await updateWeChatOpenILinkSessionRuntimeState({
        supabase: admin,
        sessionId: storedSession.id,
        lastSeenAt: new Date().toISOString()
      });
    },
    stopOnIdentityReady: true
  });
}
