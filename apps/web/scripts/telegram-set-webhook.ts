import { callTelegramApi, getArgValue, getTelegramWebhookSecret } from "./telegram-utils";

async function main() {
  const webhookBaseUrl = getArgValue("--webhook-base-url");

  if (!webhookBaseUrl) {
    throw new Error(
      "Missing required --webhook-base-url. Example: --webhook-base-url https://example.trycloudflare.com"
    );
  }

  const normalizedBaseUrl = webhookBaseUrl.replace(/\/+$/, "");
  const result = await callTelegramApi("setWebhook", {
    url: `${normalizedBaseUrl}/api/integrations/telegram/webhook`,
    secret_token: getTelegramWebhookSecret() || undefined,
    drop_pending_updates: false
  });

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown webhook setup failure.");
  process.exitCode = 1;
});
