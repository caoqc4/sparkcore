import { startDiscordGatewayWorker } from "@/lib/integrations/discord-gateway-worker";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

startDiscordGatewayWorker().catch((error) => {
  console.error("[discord-gateway-dev]", {
    error_message: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});
