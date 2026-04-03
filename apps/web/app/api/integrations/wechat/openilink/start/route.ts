import path from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import {
  createWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
  }

  const attempt = createWeChatOpenILinkLoginAttempt(user.id, workspace.id);
  const cwd = process.cwd();
  const tsxBin = path.join(cwd, "node_modules", ".bin", "tsx");
  const scriptPath = path.join(cwd, "scripts", "wechat-openilink-attempt-runner.ts");

  const child = spawn(tsxBin, [scriptPath, attempt.id], {
    cwd,
    detached: true,
    stdio: "ignore"
  });

  child.unref();

  return NextResponse.json({
    attemptId: attempt.id,
    status: attempt.status
  });
}
