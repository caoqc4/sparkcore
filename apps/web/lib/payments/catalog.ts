export type CreemCheckoutKind = "subscription" | "credits";

export type ProSubscriptionCadence = "monthly" | "quarterly" | "yearly";
export type CreditsPackKey = "credits_100" | "credits_250" | "credits_700";

export const PRO_SUBSCRIPTION_OPTIONS = [
  {
    key: "monthly" as const,
    label: "Monthly",
    price: "$14.99",
    note: "Best for trying Pro with the lowest upfront commitment.",
    envKey: "CREEM_PRICE_PRO_MONTHLY",
  },
  {
    key: "quarterly" as const,
    label: "Quarterly",
    price: "$39.99",
    note: "Lower monthly effective cost with moderate commitment.",
    envKey: "CREEM_PRICE_PRO_QUARTERLY",
  },
  {
    key: "yearly" as const,
    label: "Yearly",
    price: "$99.99",
    note: "Best value for long-term companion and media use.",
    envKey: "CREEM_PRICE_PRO_YEARLY",
  },
] satisfies Array<{
  key: ProSubscriptionCadence;
  label: string;
  price: string;
  note: string;
  envKey: string;
}>;

export const CREDIT_PACK_OPTIONS = [
  {
    key: "credits_100" as const,
    label: "100 credits",
    price: "$4.99",
    credits: 100,
    envKey: "CREEM_PRICE_CREDITS_100",
  },
  {
    key: "credits_250" as const,
    label: "250 credits",
    price: "$9.99",
    credits: 250,
    envKey: "CREEM_PRICE_CREDITS_250",
  },
  {
    key: "credits_700" as const,
    label: "700 credits",
    price: "$24.99",
    credits: 700,
    envKey: "CREEM_PRICE_CREDITS_700",
  },
] satisfies Array<{
  key: CreditsPackKey;
  label: string;
  price: string;
  credits: number;
  envKey: string;
}>;

export function isProSubscriptionCadence(value: string): value is ProSubscriptionCadence {
  return PRO_SUBSCRIPTION_OPTIONS.some((item) => item.key === value);
}

export function isCreditsPackKey(value: string): value is CreditsPackKey {
  return CREDIT_PACK_OPTIONS.some((item) => item.key === value);
}

export function getCreemPriceIdForSelection(
  kind: CreemCheckoutKind,
  key: ProSubscriptionCadence | CreditsPackKey,
) {
  const source =
    kind === "subscription"
      ? PRO_SUBSCRIPTION_OPTIONS.find((item) => item.key === key)
      : CREDIT_PACK_OPTIONS.find((item) => item.key === key);

  if (!source) {
    return null;
  }

  const value = process.env[source.envKey];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function getCreditsAmountForPack(key: CreditsPackKey) {
  return CREDIT_PACK_OPTIONS.find((item) => item.key === key)?.credits ?? null;
}
