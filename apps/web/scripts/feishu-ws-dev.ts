import { startFeishuWsWorker } from "@/lib/integrations/feishu-ws-worker";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

startFeishuWsWorker().catch((error) => {
  console.error("[feishu-ws-dev]", {
    error_message: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});
