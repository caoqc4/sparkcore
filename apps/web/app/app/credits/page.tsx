import Link from "next/link";
import { CreemCheckoutButton } from "@/components/creem-checkout-button";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductSettingsPageData } from "@/lib/product/settings";
import { createClient } from "@/lib/supabase/server";

const CREDIT_PACKAGES = [
  {
    key: "credits_100",
    label: "100 credits",
    buyLabel: "Buy 100 credits",
    price: "$4.99",
    perCredit: "$0.05 each",
    hint: "Great for occasional extra images or audio.",
  },
  {
    key: "credits_250",
    label: "250 credits",
    buyLabel: "Buy 250 credits",
    price: "$9.99",
    perCredit: "$0.04 each",
    hint: "Best balance of value and flexibility.",
  },
  {
    key: "credits_700",
    label: "700 credits",
    buyLabel: "Buy 700 credits",
    price: "$24.99",
    perCredit: "~$0.036 each",
    hint: "Best value for heavy image or audio use.",
  },
] as const;

export default async function AppCreditsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/app/credits");
  const supabase = await createClient();
  const searchParams = (await props.searchParams) ?? {};
  const [resolution, overview, settingsData, wallet] = await Promise.all([
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadDashboardOverview({ supabase, userId: user.id, roleId: null, threadId: null }),
    loadProductSettingsPageData({ supabase, user }),
    supabase
      .from("user_credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const creditBalance: number = wallet.data?.balance ?? 0;
  const feedback =
    typeof searchParams.feedback === "string" ? searchParams.feedback : null;
  const feedbackType =
    typeof searchParams.feedback_type === "string" ? searchParams.feedback_type : null;

  const roleQuerySuffix = resolution?.roleId
    ? `?role=${encodeURIComponent(resolution.roleId)}`
    : "";
  const isPro = settingsData.subscriptionSummary.currentPlanSlug === "pro";

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={`/app/subscription${roleQuerySuffix}`}>
          Back to subscription
        </Link>
      }
      currentHref="/app/credits"
      description="Review credit packs, understand usage cost, and top up when you need more."
      eyebrow="Credits"
      shellContext={overview}
      title="Credits"
    >
      {feedback ? (
        <div className={`notice ${feedbackType === "error" ? "notice-warning" : "notice-success"}`}>
          {feedback}
        </div>
      ) : null}

      {/* ── Balance (Pro only) ── */}
      {isPro && (
        <section className="site-card settings-card">
          <div className="credits-balance-row">
            <div className="credits-balance-main">
              <span className="settings-meta-label">Current balance</span>
              <span className="credits-balance-amount">{creditBalance}</span>
              <span className="credits-balance-unit">credits</span>
            </div>
            <p className="credits-balance-note">
              Credits are used automatically when your monthly image or audio allowance runs out.
              They never expire.
            </p>
          </div>
        </section>
      )}

      {/* ── How credits work (Free only — explains the system to encourage upgrade) ── */}
      {!isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">How credits work</h2>
          </div>
          <div className="credits-explainer-grid">
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">1</span>
              <div>
                <p className="credits-explainer-heading">Plan allowances come first</p>
                <p className="credits-explainer-body">
                  Pro includes 80 monthly image generations and 120 audio minutes at no extra cost.
                </p>
              </div>
            </div>
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">2</span>
              <div>
                <p className="credits-explainer-heading">Credits extend when allowance runs out</p>
                <p className="credits-explainer-body">
                  Once your monthly allowance is exhausted, credits automatically cover additional image and audio usage.
                </p>
              </div>
            </div>
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">3</span>
              <div>
                <p className="credits-explainer-heading">Pay only what you need</p>
                <p className="credits-explainer-body">
                  Credits never expire and roll over month to month. Buy a pack once and use it when needed.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Upgrade gate for free users ── */}
      {!isPro && (
        <div className="credits-pro-gate">
          <div className="credits-pro-gate-copy">
            <span className="credits-pro-gate-icon">🔒</span>
            <div>
              <p className="credits-pro-gate-title">Credits require an active Pro plan</p>
              <p className="credits-pro-gate-desc">
                Upgrade to Pro to unlock credit purchases and extend your image and audio usage beyond monthly allowances.
              </p>
            </div>
          </div>
          <Link
            className="button button-primary"
            href={`/app/subscription${roleQuerySuffix}`}
          >
            View Pro plans
          </Link>
        </div>
      )}

      {/* ── Credit packs ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">Credit packs</h2>
        </div>
        {isPro && (
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            One-time purchases. Credits roll over month to month and never expire.
          </p>
        )}
        <div className="credits-packs-grid">
          {CREDIT_PACKAGES.map((pkg) => (
            <div key={pkg.key} className={`credits-pack-card${!isPro ? " locked" : ""}`}>
              <div className="credits-pack-head">
                <span className="credits-pack-label">{pkg.label}</span>
                <span className="credits-pack-price">{pkg.price}</span>
              </div>
              <p className="credits-pack-per-credit">{pkg.perCredit} per credit</p>
              <p className="credits-pack-hint">{pkg.hint}</p>
              {isPro && (
                <div className="credits-pack-action">
                  <CreemCheckoutButton
                    className="button button-primary"
                    idleLabel={pkg.buyLabel}
                    kind="credits"
                    selectionKey={pkg.key}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Usage cost ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">Usage cost per credit</h2>
        </div>
        <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
          Cost depends on the model or asset tier selected.
        </p>
        <div className="credits-cost-grid">
          <div className="settings-meta-card">
            <span className="settings-meta-label">Image models</span>
            <div className="settings-ops-list">
              <div className="settings-op-item">
                <span>Nano Banana</span>
                <span>2 credits / image</span>
              </div>
              <div className="settings-op-item">
                <span>FLUX.2 Pro</span>
                <span>3 credits / image</span>
              </div>
              <div className="settings-op-item">
                <span>Nano Banana Pro</span>
                <span>4 credits / image</span>
              </div>
            </div>
          </div>
          <div className="settings-meta-card">
            <span className="settings-meta-label">Audio assets</span>
            <div className="settings-ops-list">
              <div className="settings-op-item">
                <span>Standard audio</span>
                <span>3 credits / minute</span>
              </div>
              <div className="settings-op-item">
                <span>Premium audio</span>
                <span>5 credits / minute</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
