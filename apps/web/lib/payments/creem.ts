import crypto from "node:crypto";

export type CreateCreemCheckoutParams = {
  userId: string;
  key: string;
  kind: "subscription" | "credits";
  successUrl: string;
  creemPriceId?: string | null;
};

export type CreateCreemCheckoutResult = {
  url: string;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function resolveCreemApiBase(apiKey: string) {
  const explicitBase = process.env.CREEM_API_BASE?.trim();
  if (explicitBase) {
    return explicitBase;
  }

  // Creem test keys must call the isolated test API host.
  if (apiKey.startsWith("creem_test_")) {
    return "https://test-api.creem.io";
  }

  return "https://api.creem.io";
}

export async function createCreemCheckoutSession(
  params: CreateCreemCheckoutParams,
): Promise<CreateCreemCheckoutResult> {
  const simulate = process.env.CREEM_SIMULATE === "true";

  if (simulate) {
    const placeholder = new URL("/api/payments/creem/redirect-placeholder", params.successUrl);
    placeholder.searchParams.set("return_to", params.successUrl);
    return { url: placeholder.toString() };
  }

  const apiKey = getEnv("CREEM_API_KEY");
  if (!params.creemPriceId) {
    throw new Error("Creem price id is not configured for this selection.");
  }

  const payload: Record<string, unknown> = {
    product_id: params.creemPriceId,
    success_url: params.successUrl,
    metadata: {
      userId: params.userId,
      key: params.key,
      kind: params.kind,
    },
  };

  const base = resolveCreemApiBase(apiKey);
  const res = await fetch(`${base}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Creem checkout create failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { checkout_url?: string; url?: string };
  const redirectUrl = data.checkout_url ?? data.url ?? null;

  if (!redirectUrl) {
    throw new Error("Creem checkout response missing checkout url.");
  }

  return { url: redirectUrl };
}

export function verifyCreemWebhookSignature(headers: Headers, rawBody: string) {
  const rawSignature = headers.get("creem-signature") || headers.get("x-creem-signature");
  const signature = rawSignature?.replace(/^sha256=/i, "") ?? null;
  if (!signature) {
    return false;
  }

  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}
