import { NextRequest, NextResponse } from "next/server";
import {
  getCreditsAmountForPack,
  isCreditsPackKey,
  isProSubscriptionCadence,
  type CreditsPackKey,
  type ProSubscriptionCadence,
} from "@/lib/payments/catalog";
import { verifyCreemWebhookSignature } from "@/lib/payments/creem";
import { createAdminClient } from "@/lib/supabase/admin";

type CreemEvent = {
  id?: string;
  eventType?: string;
  object?: Record<string, unknown>;
};

type CheckoutMetadata = {
  userId?: string;
  key?: string;
  kind?: "subscription" | "credits";
};

function parseDateValue(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "number") {
    const timestamp = value > 1e12 ? value : value * 1000;
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

function extractCurrentPeriodEnd(mainObject: Record<string, unknown>) {
  const candidates = [
    mainObject.current_period_end,
    mainObject.current_period_end_at,
    mainObject.currentPeriodEnd,
    mainObject.currentPeriodEndAt,
    (mainObject.current_period as Record<string, unknown> | undefined)?.end,
    (mainObject.current_period as Record<string, unknown> | undefined)?.ends_at,
    (mainObject.billing_period as Record<string, unknown> | undefined)?.end,
    (mainObject.billing_period as Record<string, unknown> | undefined)?.ends_at,
    mainObject.next_payment_at,
    mainObject.next_payment_date,
    mainObject.next_billing_at,
    mainObject.next_billing_date,
    (mainObject.order as Record<string, unknown> | undefined)?.current_period_end,
    (mainObject.order as Record<string, unknown> | undefined)?.current_period_end_at,
    ((mainObject.order as Record<string, unknown> | undefined)?.billing_period as
      | Record<string, unknown>
      | undefined)?.end,
    ((mainObject.order as Record<string, unknown> | undefined)?.billing_period as
      | Record<string, unknown>
      | undefined)?.ends_at,
  ];

  for (const candidate of candidates) {
    const parsed = parseDateValue(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function deriveRenewalDateFromCadence(key: ProSubscriptionCadence) {
  const date = new Date();
  if (key === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (key === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString();
}

function getCheckoutMetadata(event: CreemEvent) {
  const type = event.eventType;
  const mainObject = event.object ?? {};

  let metadata: CheckoutMetadata = {};
  let providerPaymentId: string | null = null;
  let providerSubscriptionId: string | null = null;
  let amountCents: number | null = null;
  let currency: string | null = null;

  if (type === "checkout.completed") {
    const order = (mainObject.order as Record<string, unknown> | undefined) ?? {};
    const subscription = (mainObject.subscription as Record<string, unknown> | undefined) ?? {};
    metadata = (mainObject.metadata as CheckoutMetadata | undefined) ?? {};
    providerPaymentId =
      (typeof order.id === "string" && order.id) ||
      (typeof mainObject.id === "string" && mainObject.id) ||
      null;
    providerSubscriptionId =
      (typeof order.subscription_id === "string" && order.subscription_id) ||
      (typeof subscription.id === "string" && subscription.id) ||
      (typeof order.subscriptionId === "string" && order.subscriptionId) ||
      null;
    amountCents = typeof order.amount === "number" ? order.amount : null;
    currency = typeof order.currency === "string" ? order.currency.toLowerCase() : null;
  } else {
    const lastTransaction = (mainObject.last_transaction as Record<string, unknown> | undefined) ?? {};
    const product = (mainObject.product as Record<string, unknown> | undefined) ?? {};
    metadata = (mainObject.metadata as CheckoutMetadata | undefined) ?? {};
    providerPaymentId =
      (typeof lastTransaction.order === "string" && lastTransaction.order) ||
      (typeof event.id === "string" && event.id) ||
      null;
    providerSubscriptionId =
      (typeof mainObject.id === "string" && mainObject.id) || null;
    amountCents = typeof product.price === "number" ? product.price : null;
    currency = typeof product.currency === "string" ? product.currency.toLowerCase() : null;
  }

  return {
    metadata,
    providerPaymentId,
    providerSubscriptionId,
    amountCents,
    currency,
    renewalDate:
      event.object && typeof event.object === "object"
        ? extractCurrentPeriodEnd(event.object)
        : null,
  };
}

async function receiptExists(admin: ReturnType<typeof createAdminClient>, providerPaymentId: string) {
  const { data, error } = await admin
    .from("user_payment_receipts")
    .select("id")
    .eq("provider", "creem")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function insertReceipt(args: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  providerPaymentId: string;
  providerSubscriptionId: string | null;
  kind: "subscription" | "credits";
  selectionKey: string;
  amountCents: number | null;
  currency: string | null;
  status?: "pending" | "succeeded" | "failed" | "canceled";
  metadata: Record<string, unknown>;
}) {
  const { error } = await args.admin.from("user_payment_receipts").insert({
    user_id: args.userId,
    provider: "creem",
    provider_payment_id: args.providerPaymentId,
    provider_subscription_id: args.providerSubscriptionId,
    checkout_kind: args.kind,
    selection_key: args.selectionKey,
    status: args.status ?? "succeeded",
    amount_cents: args.amountCents,
    currency: args.currency,
    metadata: args.metadata,
  });

  if (error) {
    throw error;
  }
}

async function upsertSubscriptionSnapshot(args: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  planName: string | null;
  planStatus: "inactive" | "trial" | "active" | "past_due" | "canceled";
  renewalDate: string | null;
  metadata: Record<string, unknown>;
}) {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/app/subscription`;
  const { error } = await args.admin.from("user_subscription_snapshots").upsert(
    {
      user_id: args.userId,
      plan_name: args.planName,
      plan_status: args.planStatus,
      renewal_date: args.renewalDate,
      upgrade_url: upgradeUrl,
      metadata: args.metadata,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

async function creditUserWallet(args: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  amount: number;
  providerPaymentId: string;
  selectionKey: CreditsPackKey;
  rawEvent: CreemEvent;
}) {
  const { data: wallet, error: walletError } = await args.admin
    .from("user_credit_wallets")
    .select("balance, lifetime_credited, lifetime_debited, metadata")
    .eq("user_id", args.userId)
    .maybeSingle();

  if (walletError) {
    throw walletError;
  }

  const currentBalance = typeof wallet?.balance === "number" ? wallet.balance : 0;
  const lifetimeCredited =
    typeof wallet?.lifetime_credited === "number" ? wallet.lifetime_credited : 0;
  const lifetimeDebited =
    typeof wallet?.lifetime_debited === "number" ? wallet.lifetime_debited : 0;
  const balanceAfter = currentBalance + args.amount;

  const { error: upsertError } = await args.admin.from("user_credit_wallets").upsert(
    {
      user_id: args.userId,
      balance: balanceAfter,
      lifetime_credited: lifetimeCredited + args.amount,
      lifetime_debited: lifetimeDebited,
      metadata: {
        ...(typeof wallet?.metadata === "object" && wallet?.metadata ? wallet.metadata : {}),
        last_credit_purchase: {
          provider: "creem",
          provider_payment_id: args.providerPaymentId,
          selection_key: args.selectionKey,
        },
      },
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    throw upsertError;
  }

  const { error: ledgerError } = await args.admin.from("user_credit_ledger").insert({
    user_id: args.userId,
    direction: "credit",
    amount: args.amount,
    balance_after: balanceAfter,
    reason: "credits_purchase",
    metadata: {
      provider: "creem",
      provider_payment_id: args.providerPaymentId,
      selection_key: args.selectionKey,
      raw_event_id: args.rawEvent.id ?? null,
    },
  });

  if (ledgerError) {
    throw ledgerError;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureOk = verifyCreemWebhookSignature(req.headers, rawBody);

  if (!signatureOk) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(rawBody) as CreemEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = typeof event.eventType === "string" ? event.eventType : null;
  if (!type) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { metadata, providerPaymentId, providerSubscriptionId, amountCents, currency, renewalDate } =
      getCheckoutMetadata(event);

    const userId = typeof metadata.userId === "string" ? metadata.userId : null;
    const key = typeof metadata.key === "string" ? metadata.key : null;
    const kind = metadata.kind === "subscription" || metadata.kind === "credits" ? metadata.kind : null;

    if (!userId || !key || !kind) {
      return NextResponse.json({ error: "Missing checkout metadata" }, { status: 400 });
    }

    if (!providerPaymentId && type !== "subscription.canceled" && type !== "subscription.cancelled" && type !== "subscription.past_due") {
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    if (
      providerPaymentId &&
      (type === "checkout.completed" || type === "subscription.paid") &&
      (await receiptExists(admin, providerPaymentId))
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (kind === "credits") {
      if (type !== "checkout.completed") {
        return NextResponse.json({ received: true });
      }

      if (!isCreditsPackKey(key)) {
        return NextResponse.json({ error: "Invalid credits pack key" }, { status: 400 });
      }

      const creditsAmount = getCreditsAmountForPack(key);
      if (!creditsAmount || !providerPaymentId) {
        return NextResponse.json({ error: "Credits pack is not configured" }, { status: 400 });
      }

      await insertReceipt({
        admin,
        userId,
        providerPaymentId,
        providerSubscriptionId,
        kind: "credits",
        selectionKey: key,
        amountCents,
        currency,
        metadata: {
          event_type: type,
          event_id: event.id ?? null,
        },
      });

      await creditUserWallet({
        admin,
        userId,
        amount: creditsAmount,
        providerPaymentId,
        selectionKey: key,
        rawEvent: event,
      });

      return NextResponse.json({ received: true });
    }

    if (!isProSubscriptionCadence(key)) {
      return NextResponse.json({ error: "Invalid subscription cadence key" }, { status: 400 });
    }

    const statusMap: Record<string, "active" | "past_due" | "canceled"> = {
      "checkout.completed": "active",
      "subscription.active": "active",
      "subscription.paid": "active",
      "subscription.past_due": "past_due",
      "subscription.canceled": "canceled",
      "subscription.cancelled": "canceled",
      "subscription.expired": "canceled",
    };

    const mappedStatus = statusMap[type];
    if (!mappedStatus) {
      return NextResponse.json({ received: true });
    }

    if ((type === "checkout.completed" || type === "subscription.paid") && providerPaymentId) {
      await insertReceipt({
        admin,
        userId,
        providerPaymentId,
        providerSubscriptionId,
        kind: "subscription",
        selectionKey: key,
        amountCents,
        currency,
        metadata: {
          event_type: type,
          event_id: event.id ?? null,
        },
      });
    }

    await upsertSubscriptionSnapshot({
      admin,
      userId,
      planName: "pro",
      planStatus: mappedStatus,
      renewalDate:
        mappedStatus === "active"
          ? renewalDate ?? deriveRenewalDateFromCadence(key)
          : renewalDate,
      metadata: {
        provider: "creem",
        subscription_cadence: key,
        provider_subscription_id: providerSubscriptionId,
        last_event_type: type,
        last_event_id: event.id ?? null,
        last_provider_payment_id: providerPaymentId,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
