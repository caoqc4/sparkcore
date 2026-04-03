import fs from "node:fs";
import path from "node:path";
import { getWeChatOpenILinkSessionEnv } from "@/lib/env";

export type WeChatOpenILinkSession = {
  botToken: string;
  baseUrl: string;
  botId?: string | null;
  userId?: string | null;
  syncBuf?: string | null;
  updatedAt?: string | null;
};

function getSessionFilePath() {
  const { sessionFile } = getWeChatOpenILinkSessionEnv();
  return path.isAbsolute(sessionFile)
    ? sessionFile
    : path.join(process.cwd(), sessionFile);
}

export function readWeChatOpenILinkSession() {
  const sessionFilePath = getSessionFilePath();

  if (!fs.existsSync(sessionFilePath)) {
    return null;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(sessionFilePath, "utf8")) as WeChatOpenILinkSession;

    if (
      typeof raw.botToken !== "string" ||
      raw.botToken.length === 0 ||
      typeof raw.baseUrl !== "string" ||
      raw.baseUrl.length === 0
    ) {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

export function writeWeChatOpenILinkSession(session: WeChatOpenILinkSession) {
  const sessionFilePath = getSessionFilePath();
  fs.writeFileSync(
    sessionFilePath,
    JSON.stringify(
      {
        ...session,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    )
  );
}
