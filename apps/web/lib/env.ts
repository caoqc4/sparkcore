import type { CharacterChannelSlug } from "@/lib/product/character-channels";

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

export function getAzureSpeechEnv() {
  const apiKey = process.env.AZURE_SPEECH_API_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!apiKey || !region) {
    throw new Error(
      "Missing Azure Speech environment variables. Set AZURE_SPEECH_API_KEY and AZURE_SPEECH_REGION."
    );
  }

  return { apiKey, region };
}

export function getElevenLabsEnv() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing ElevenLabs environment variable. Set ELEVENLABS_API_KEY."
    );
  }

  return { apiKey };
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
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  if (!botToken) {
    throw new Error("Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN.");
  }

  return {
    botToken,
    webhookSecret,
    botUsername
  };
}

function getTelegramEnvSuffix(slug: CharacterChannelSlug) {
  switch (slug) {
    case "teven":
      return "TEVEN";
    case "velia":
      return "VELIA";
    case "caria":
    default:
      return "CARIA";
  }
}

export function getTelegramBotConfig(slug: CharacterChannelSlug) {
  const suffix = getTelegramEnvSuffix(slug);
  const botToken = process.env[`TELEGRAM_BOT_TOKEN_${suffix}`];
  const webhookSecret = process.env[`TELEGRAM_WEBHOOK_SECRET_${suffix}`] ?? null;
  const botUsername = process.env[`TELEGRAM_BOT_USERNAME_${suffix}`] ?? null;

  if (!botToken) {
    throw new Error(
      `Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN_${suffix}.`
    );
  }

  return {
    botToken,
    webhookSecret,
    botUsername
  };
}

export function getFollowUpCronEnv() {
  const secret = process.env.FOLLOW_UP_CRON_SECRET;
  const defaultSender =
    (process.env.FOLLOW_UP_DEFAULT_SENDER ?? "stub") as "stub" | "telegram";
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

export function getKnowledgeProcessingEnv() {
  const secret = process.env.KNOWLEDGE_PROCESSING_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "Missing knowledge processing secret. Set KNOWLEDGE_PROCESSING_SECRET."
    );
  }

  return {
    secret
  };
}

export function getOptionalPostHogEnv() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiHost
  };
}

export function getOptionalClarityEnv() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId) {
    return null;
  }

  return {
    projectId
  };
}
