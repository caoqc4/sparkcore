import os from "node:os";
import { runTelegramInboundWorker } from "@/lib/integrations/telegram-inbound-worker";
import { CHARACTER_CHANNEL_SLUGS } from "@/lib/product/character-channels";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

const IDLE_POLL_MS = 1500;
const ACTIVE_POLL_MS = 200;
const BATCH_SIZE = 8;

let shuttingDown = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const claimedBy = `telegram-worker:${os.hostname()}:${process.pid}`;

  while (!shuttingDown) {
    let claimedAny = false;

    for (const characterChannelSlug of CHARACTER_CHANNEL_SLUGS) {
      if (shuttingDown) {
        break;
      }

      try {
        const result = await runTelegramInboundWorker({
          characterChannelSlug,
          claimedBy,
          limit: BATCH_SIZE,
        });

        if (result.claimed_count > 0) {
          claimedAny = true;
        }
      } catch (error) {
        console.error("[telegram-inbound-worker:loop]", {
          character_channel_slug: characterChannelSlug,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!shuttingDown) {
      await sleep(claimedAny ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    }
  }
}

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

main().catch((error) => {
  console.error("[telegram-inbound-worker]", {
    error_message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
