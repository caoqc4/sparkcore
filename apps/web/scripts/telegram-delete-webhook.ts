import {
  callTelegramApi,
  getCharacterChannelArg,
  hasFlag
} from "./telegram-utils";

async function main() {
  const characterChannel = getCharacterChannelArg();
  const result = await callTelegramApi("deleteWebhook", {
    drop_pending_updates: hasFlag("--drop-pending-updates")
  }, characterChannel);

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown webhook deletion failure."
  );
  process.exitCode = 1;
});
