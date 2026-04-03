import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type WeChatOpenILinkLoginAttemptStatus =
  | "starting"
  | "qr_ready"
  | "scanned"
  | "connected"
  | "identity_ready"
  | "error";

export type WeChatOpenILinkLoginAttempt = {
  id: string;
  userId: string;
  workspaceId: string;
  status: WeChatOpenILinkLoginAttemptStatus;
  qrUrl: string | null;
  errorMessage: string | null;
  botId: string | null;
  wechatUserId: string | null;
  channelId: string | null;
  peerId: string | null;
  platformUserId: string | null;
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type WeChatOpenILinkLoginAttemptStore = {
  attempts: Record<string, WeChatOpenILinkLoginAttempt>;
};

function getStoreFilePath() {
  return path.join(process.cwd(), ".openilink-wechat-login-attempts.json");
}

function readStore(): WeChatOpenILinkLoginAttemptStore {
  const storeFilePath = getStoreFilePath();

  if (!fs.existsSync(storeFilePath)) {
    return { attempts: {} };
  }

  try {
    const raw = JSON.parse(
      fs.readFileSync(storeFilePath, "utf8")
    ) as WeChatOpenILinkLoginAttemptStore;

    if (!raw || typeof raw !== "object" || !raw.attempts || typeof raw.attempts !== "object") {
      return { attempts: {} };
    }

    return raw;
  } catch {
    return { attempts: {} };
  }
}

function writeStore(store: WeChatOpenILinkLoginAttemptStore) {
  fs.writeFileSync(getStoreFilePath(), JSON.stringify(store, null, 2));
}

export function createWeChatOpenILinkLoginAttempt(userId: string, workspaceId: string) {
  const store = readStore();
  const now = new Date().toISOString();
  const attempt: WeChatOpenILinkLoginAttempt = {
    id: crypto.randomUUID(),
    userId,
    workspaceId,
    status: "starting",
    qrUrl: null,
    errorMessage: null,
    botId: null,
    wechatUserId: null,
    channelId: null,
    peerId: null,
    platformUserId: null,
    connectedAt: null,
    createdAt: now,
    updatedAt: now
  };

  store.attempts[attempt.id] = attempt;
  writeStore(store);

  return attempt;
}

export function readWeChatOpenILinkLoginAttempt(attemptId: string) {
  const store = readStore();
  return store.attempts[attemptId] ?? null;
}

export function updateWeChatOpenILinkLoginAttempt(
  attemptId: string,
  patch: Partial<Omit<WeChatOpenILinkLoginAttempt, "id" | "userId" | "workspaceId" | "createdAt">>
) {
  const store = readStore();
  const current = store.attempts[attemptId];

  if (!current) {
    return null;
  }

  const next: WeChatOpenILinkLoginAttempt = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  store.attempts[attemptId] = next;
  writeStore(store);
  return next;
}

export function findPendingWeChatOpenILinkLoginAttemptByWeChatUserId(
  wechatUserId: string
) {
  const store = readStore();
  const attempts = Object.values(store.attempts)
    .filter(
      (attempt) =>
        attempt.wechatUserId === wechatUserId &&
        (attempt.status === "connected" || attempt.status === "identity_ready")
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return attempts[0] ?? null;
}
