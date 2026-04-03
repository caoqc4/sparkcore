import {
  createWeChatOpenILinkClient,
  getWeChatLoginSessionFromResult
} from "@/lib/integrations/wechat-openilink";
import {
  readWeChatOpenILinkLoginAttempt,
  updateWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";
import {
  upsertActiveWeChatOpenILinkSession,
  updateWeChatOpenILinkSessionRuntimeState
} from "@/lib/integrations/wechat-openilink-sessions";
import { startWeChatOpenILinkWorkerWithClient } from "@/lib/integrations/wechat-openilink-worker";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

async function main() {
  const attemptId = process.argv[2];

  if (!attemptId) {
    throw new Error("Missing attempt id.");
  }

  const attempt = readWeChatOpenILinkLoginAttempt(attemptId);

  if (!attempt) {
    throw new Error("WeChat login attempt not found.");
  }

  const client = await createWeChatOpenILinkClient(null);

  const result = await client.loginWithQr({
    on_qrcode: (img: string) => {
      updateWeChatOpenILinkLoginAttempt(attemptId, {
        status: "qr_ready",
        qrUrl: img,
        errorMessage: null
      });
    },
    on_scanned: () => {
      updateWeChatOpenILinkLoginAttempt(attemptId, {
        status: "scanned",
        errorMessage: null
      });
    },
    on_expired: () => {
      updateWeChatOpenILinkLoginAttempt(attemptId, {
        status: "starting"
      });
    }
  });

  const session = getWeChatLoginSessionFromResult(result);

  if (!session) {
    updateWeChatOpenILinkLoginAttempt(attemptId, {
      status: "error",
      errorMessage: result.message || "WeChat login failed."
    });
    throw new Error(result.message || "WeChat login failed.");
  }

  const admin = createAdminClient();
  const storedSession = await upsertActiveWeChatOpenILinkSession({
    supabase: admin,
    workspaceId: attempt.workspaceId,
    userId: attempt.userId,
    session,
    status: "pending",
    metadata: {
      attempt_id: attempt.id
    }
  });
  updateWeChatOpenILinkLoginAttempt(attemptId, {
    status: "connected",
    qrUrl: null,
    errorMessage: null,
    botId: session.botId ?? null,
    wechatUserId: session.userId ?? null,
    connectedAt: new Date().toISOString()
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

main().catch((error) => {
  const attemptId = process.argv[2];
  if (attemptId) {
    updateWeChatOpenILinkLoginAttempt(attemptId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error)
    });
  }

  console.error("[wechat-openilink-attempt-runner]", {
    error_message: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});
