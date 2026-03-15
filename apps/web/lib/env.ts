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
