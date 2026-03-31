import {
  callTelegramApi,
  getArgValue,
  getCharacterChannelArg,
  getTelegramBotRuntimeConfig,
  getTelegramWebhookSecret
} from "./telegram-utils";

async function main() {
  const webhookBaseUrl = getArgValue("--webhook-base-url");
  const characterChannel = getCharacterChannelArg();

  if (!webhookBaseUrl) {
    throw new Error(
      "Missing required --webhook-base-url. Example: --webhook-base-url https://example.trycloudflare.com"
    );
  }

  const normalizedBaseUrl = webhookBaseUrl.replace(/\/+$/, "");
  const runtimeConfig = getTelegramBotRuntimeConfig(characterChannel);
  const webhookPath = characterChannel
    ? `/api/integrations/telegram/webhook/${characterChannel}`
    : "/api/integrations/telegram/webhook";
  const result = await callTelegramApi("setWebhook", {
    url: `${normalizedBaseUrl}${webhookPath}`,
    secret_token: characterChannel
      ? runtimeConfig.webhookSecret || undefined
      : getTelegramWebhookSecret() || undefined,
    drop_pending_updates: false
  }, characterChannel);

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown webhook setup failure.");
  process.exitCode = 1;
});
