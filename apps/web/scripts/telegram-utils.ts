import { createClient } from "@supabase/supabase-js";
import { getTelegramBotEnv, getTelegramBotConfig } from "@/lib/env";
import {
  isCharacterChannelSlug,
  type CharacterChannelSlug
} from "@/lib/product/character-channels";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

export function createAdminSupabaseClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export function getTelegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
}

export function getCharacterChannelArg() {
  const value = getArgValue("--character-channel");

  if (!value) {
    return null;
  }

  if (!isCharacterChannelSlug(value)) {
    throw new Error(
      "Invalid --character-channel. Expected one of: caria, teven, velia."
    );
  }

  return value as CharacterChannelSlug;
}

export function getTelegramBotRuntimeConfig(slug?: CharacterChannelSlug | null) {
  if (slug) {
    return getTelegramBotConfig(slug);
  }

  return getTelegramBotEnv();
}

export async function callTelegramApi(
  method: string,
  params?: Record<string, unknown>,
  slug?: CharacterChannelSlug | null
) {
  const token = getTelegramBotRuntimeConfig(slug).botToken;
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);

  if (!params || Object.keys(params).length === 0) {
    const response = await fetch(url);
    return response.json();
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  return response.json();
}
