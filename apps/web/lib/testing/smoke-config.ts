import { type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

export type SmokeConfig = {
  secret: string;
  email: string;
  password: string;
  serviceRoleKey: string;
  url: string;
  anonKey: string;
};

const DEV_SMOKE_SECRET = "sparkcore-smoke-local";
const DEV_SMOKE_EMAIL = "smoke@example.com";
const DEV_SMOKE_PASSWORD = "SparkcoreSmoke123!";

function getFallbackValue(envKey: "secret" | "email" | "password") {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  switch (envKey) {
    case "secret":
      return DEV_SMOKE_SECRET;
    case "email":
      return DEV_SMOKE_EMAIL;
    case "password":
      return DEV_SMOKE_PASSWORD;
  }
}

export function getSmokeConfig() {
  const { url, anonKey } = getSupabaseEnv();
  const secret =
    process.env.PLAYWRIGHT_SMOKE_SECRET ?? getFallbackValue("secret");
  const email =
    process.env.PLAYWRIGHT_SMOKE_EMAIL ?? getFallbackValue("email");
  const password =
    process.env.PLAYWRIGHT_SMOKE_PASSWORD ?? getFallbackValue("password");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !email || !password || !serviceRoleKey) {
    return null;
  }

  return {
    secret,
    email,
    password,
    serviceRoleKey,
    url,
    anonKey
  } satisfies SmokeConfig;
}

export function requireSmokeConfig(message: string) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(message);
  }

  return config;
}

export function isAuthorizedSmokeRequest(
  request: NextRequest,
  config: SmokeConfig | null
) {
  if (!config) {
    return false;
  }

  const headerSecret = request.headers.get("x-smoke-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return headerSecret === config.secret || querySecret === config.secret;
}
