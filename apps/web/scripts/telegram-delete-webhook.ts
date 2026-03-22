import { callTelegramApi, hasFlag } from "./telegram-utils";

async function main() {
  const result = await callTelegramApi("deleteWebhook", {
    drop_pending_updates: hasFlag("--drop-pending-updates")
  });

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown webhook deletion failure."
  );
  process.exitCode = 1;
});
