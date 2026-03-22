export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url, anonKey };
}

export function getLiteLLMEnv() {
  const baseUrl = process.env.LITELLM_BASE_URL;
  const apiKey = process.env.LITELLM_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing LiteLLM environment variables. Set LITELLM_BASE_URL and LITELLM_API_KEY."
    );
  }

  return { baseUrl, apiKey };
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, serviceRoleKey };
}

export function getTelegramBotEnv() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? null;

  if (!botToken) {
    throw new Error("Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN.");
  }

  return {
    botToken,
    webhookSecret
  };
}

export function getFollowUpCronEnv() {
  const secret = process.env.FOLLOW_UP_CRON_SECRET;
  const defaultSender = process.env.FOLLOW_UP_DEFAULT_SENDER ?? "stub";
  const enableTelegramSend = process.env.FOLLOW_UP_ENABLE_TELEGRAM_SEND === "true";

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "Missing follow-up cron secret. Set FOLLOW_UP_CRON_SECRET."
    );
  }

  if (defaultSender !== "stub" && defaultSender !== "telegram") {
    throw new Error(
      "Invalid FOLLOW_UP_DEFAULT_SENDER. Expected 'stub' or 'telegram'."
    );
  }

  return {
    secret,
    defaultSender,
    enableTelegramSend
  };
}
