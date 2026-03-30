function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getTelegramBotToken() {
  return getRequiredEnv("TELEGRAM_BOT_TOKEN");
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
