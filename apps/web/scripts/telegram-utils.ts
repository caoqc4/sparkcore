import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

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

export function getTelegramBotToken() {
  return getRequiredEnv("TELEGRAM_BOT_TOKEN");
}

export function getTelegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
}

export async function callTelegramApi(method: string, params?: Record<string, unknown>) {
  const token = getTelegramBotToken();
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
