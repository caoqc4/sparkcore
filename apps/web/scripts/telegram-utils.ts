import { createClient } from "@supabase/supabase-js";
import { callTelegramApi, getTelegramBotToken } from "@/lib/integrations/telegram-api";
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

export { callTelegramApi, getTelegramBotToken };
