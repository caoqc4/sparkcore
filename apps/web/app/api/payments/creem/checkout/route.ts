import { NextRequest, NextResponse } from "next/server";
import { createCreemCheckoutSession } from "@/lib/payments/creem";
import {
  getCreemPriceIdForSelection,
  isCreditsPackKey,
  isProSubscriptionCadence,
  type CreditsPackKey,
  type ProSubscriptionCadence,
} from "@/lib/payments/catalog";
import { createClient } from "@/lib/supabase/server";

type CheckoutBody = {
  kind: "subscription" | "credits";
  key: string;
};

function getBaseAppUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseAppUrl = getBaseAppUrl(req);
    if (body.kind === "subscription") {
      const successUrl = `${baseAppUrl}/app/subscription?feedback=${encodeURIComponent("Checkout started. Complete payment in Creem to activate Pro.")}&feedback_type=success`;
      const cancelUrl = `${baseAppUrl}/app/subscription?feedback=${encodeURIComponent("Checkout cancelled.")}&feedback_type=error`;

      if (!isProSubscriptionCadence(body.key)) {
        return NextResponse.json({ error: "Invalid subscription cadence." }, { status: 400 });
      }

      const { url } = await createCreemCheckoutSession({
        userId: user.id,
        key: body.key,
        kind: "subscription",
        successUrl,
        creemPriceId: getCreemPriceIdForSelection("subscription", body.key as ProSubscriptionCadence),
      });

      return NextResponse.json({ url });
    }

    if (!isCreditsPackKey(body.key)) {
      return NextResponse.json({ error: "Invalid credits pack." }, { status: 400 });
    }

    const successUrl = `${baseAppUrl}/app/credits?feedback=${encodeURIComponent("Checkout started. Complete payment in Creem to add credits.")}&feedback_type=success`;
    const cancelUrl = `${baseAppUrl}/app/credits?feedback=${encodeURIComponent("Credits checkout cancelled.")}&feedback_type=error`;

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        { error: "Unable to verify subscription status." },
        { status: 500 },
      );
    }

    const planName =
      typeof subscription?.plan_name === "string"
        ? subscription.plan_name.trim().toLowerCase()
        : null;
    const planStatus =
      typeof subscription?.plan_status === "string"
        ? subscription.plan_status.trim().toLowerCase()
        : "inactive";
    const proEligible = planName === "pro" && planStatus === "active";
    if (!proEligible) {
      return NextResponse.json(
        { error: "Credits require an active Pro plan." },
        { status: 403 },
      );
    }

    const { url } = await createCreemCheckoutSession({
      userId: user.id,
      key: body.key,
      kind: "credits",
      successUrl,
      creemPriceId: getCreemPriceIdForSelection("credits", body.key as CreditsPackKey),
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Creem checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
