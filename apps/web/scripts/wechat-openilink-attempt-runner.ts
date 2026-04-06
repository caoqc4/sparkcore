import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";
import { runWeChatOpenILinkLoginAttempt } from "@/lib/integrations/wechat-openilink-login-runner";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

async function main() {
  const attemptId = process.argv[2];

  if (!attemptId) {
    throw new Error("Missing attempt id.");
  }
  await runWeChatOpenILinkLoginAttempt(attemptId);
}

main().catch((error) => {
  const attemptId = process.argv[2];
  const admin = createAdminClient();
  if (attemptId) {
    void updateWeChatOpenILinkLoginAttempt({
      supabase: admin,
      attemptId,
      patch: {
        status: "error",
        error_message: error instanceof Error ? error.message : String(error)
      }
    });
  }

  console.error("[wechat-openilink-attempt-runner]", {
    error_message: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});
