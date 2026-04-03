import { createAdminClient } from "@/lib/supabase/admin";
import {
  listActiveWeChatOpenILinkSessions,
  markWeChatOpenILinkSessionExpired,
  toWeChatOpenILinkRuntimeSession,
  updateWeChatOpenILinkSessionRuntimeState
} from "@/lib/integrations/wechat-openilink-sessions";
import { createWeChatOpenILinkClient } from "@/lib/integrations/wechat-openilink";
import { startWeChatOpenILinkWorkerWithClient } from "@/lib/integrations/wechat-openilink-worker";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function startManagedSession(sessionId: string) {
  const admin = createAdminClient();
  const sessions = await listActiveWeChatOpenILinkSessions(admin);
  const stored = sessions.find((session) => session.id === sessionId);

  if (!stored) {
    console.warn("[wechat-openilink-session-manager] session disappeared before start", {
      session_id: sessionId
    });
    return;
  }

  const runtimeSession = toWeChatOpenILinkRuntimeSession(stored);
  const client = await createWeChatOpenILinkClient(runtimeSession);

  console.info("[wechat-openilink-session-manager] starting session", {
    session_id: stored.id,
    user_id: stored.user_id,
    wechat_user_id: stored.wechat_user_id
  });

  await startWeChatOpenILinkWorkerWithClient({
    client,
    session: runtimeSession,
    logger: console,
    onSyncBufUpdate: async (buf) => {
      await updateWeChatOpenILinkSessionRuntimeState({
        supabase: admin,
        sessionId: stored.id,
        syncBuf: buf,
        lastSeenAt: new Date().toISOString()
      });
    },
    onSessionActivity: async () => {
      await updateWeChatOpenILinkSessionRuntimeState({
        supabase: admin,
        sessionId: stored.id,
        lastSeenAt: new Date().toISOString()
      });
    },
    onSessionExpired: async () => {
      await markWeChatOpenILinkSessionExpired({
        supabase: admin,
        sessionId: stored.id,
        reason: "openilink_session_expired"
      });
    }
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const admin = createAdminClient();
  const runningSessionIds = new Set<string>();
  let lastReportedCount = -1;

  while (true) {
    try {
      const sessions = await listActiveWeChatOpenILinkSessions(admin);

      if (sessions.length !== lastReportedCount) {
        console.info("[wechat-openilink-session-manager] active sessions", {
          count: sessions.length
        });
        lastReportedCount = sessions.length;
      }

      for (const session of sessions) {
        if (runningSessionIds.has(session.id)) {
          continue;
        }

        runningSessionIds.add(session.id);
        void startManagedSession(session.id)
          .catch((error) => {
            console.error("[wechat-openilink-session-manager] session failed", {
              session_id: session.id,
              user_id: session.user_id,
              error_message: formatError(error)
            });
          })
          .finally(() => {
            runningSessionIds.delete(session.id);
          });
      }
    } catch (error) {
      console.error("[wechat-openilink-session-manager] loop failed", {
        error_message: formatError(error)
      });
    }

    await sleep(5000);
  }
}

main().catch((error) => {
  console.error("[wechat-openilink-session-manager]", {
    error_message: formatError(error)
  });
  process.exitCode = 1;
});
