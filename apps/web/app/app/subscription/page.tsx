import Link from "next/link";
import { BillingCadenceSelector } from "@/components/billing-cadence-selector";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductSettingsPageData } from "@/lib/product/settings";
import { createClient } from "@/lib/supabase/server";

const PRO_CADENCE_OPTIONS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "$14.99",
    period: "/ mo",
    perMonthNote: null,
    savingsNote: null,
  },
  {
    key: "quarterly",
    label: "Quarterly",
    price: "$39.99",
    period: "/ qtr",
    perMonthNote: "~$13.33 / mo",
    savingsNote: "Save 11%",
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "$99.99",
    period: "/ yr",
    perMonthNote: "~$8.33 / mo",
    savingsNote: "Save 44%",
  },
] as const;

export default async function AppSubscriptionPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/app/subscription");
  const supabase = await createClient();
  const searchParams = (await props.searchParams) ?? {};
  const [resolution, overview, settingsData] = await Promise.all([
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadDashboardOverview({ supabase, userId: user.id, roleId: null, threadId: null }),
    loadProductSettingsPageData({ supabase, user }),
  ]);
  const feedback =
    typeof searchParams.feedback === "string" ? searchParams.feedback : null;
  const feedbackType =
    typeof searchParams.feedback_type === "string" ? searchParams.feedback_type : null;

  const roleQuerySuffix = resolution?.roleId
    ? `?role=${encodeURIComponent(resolution.roleId)}`
    : "";
  const checkoutHref =
    settingsData.subscriptionSummary.upgradeHref !== "/app/subscription"
      ? settingsData.subscriptionSummary.upgradeHref
      : null;

  const isPro = settingsData.subscriptionSummary.currentPlanSlug === "pro";
  const shouldHideCheckoutFeedback =
    isPro &&
    feedbackType !== "error" &&
    typeof feedback === "string" &&
    feedback.toLowerCase().includes("checkout started");
  const renewalLabel = settingsData.subscriptionSummary.renewalDateLabel
    ? new Date(settingsData.subscriptionSummary.renewalDateLabel).toLocaleDateString()
    : "—";

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={`/app/settings${roleQuerySuffix}`}>
          Back to settings
        </Link>
      }
      currentHref="/app/subscription"
      description={isPro ? "Manage your subscription, billing period, and credits." : "Compare plans, review credits, and manage your billing."}
      eyebrow="Subscription"
      shellContext={overview}
      title="Plans & billing"
    >
      {feedback && !shouldHideCheckoutFeedback ? (
        <div className={`notice ${feedbackType === "error" ? "notice-warning" : "notice-success"}`}>
          {feedback}
        </div>
      ) : null}

      {/* ── Pro: current subscription status ── */}
      {isPro && (
        <section className="site-card settings-card">
          <div className="sub-pro-status">
            <div className="sub-pro-status-left">
              <span className="settings-plan-badge tier-pro">Pro</span>
              {renewalLabel !== "—" && (
                <span className="settings-sub-renewal">Renews {renewalLabel}</span>
              )}
              <p className="sub-pro-status-desc">
                Premium models and full monthly allowances are active.
              </p>
            </div>
            <div className="sub-pro-status-actions">
              <Link
                className="button button-secondary"
                href={settingsData.subscriptionSummary.upgradeHref}
              >
                Manage billing
              </Link>
              <Link className="button button-secondary" href={`/app/credits${roleQuerySuffix}`}>
                View credits
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Pro: switch billing period ── */}
      {isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">Billing period</h2>
          </div>
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            Switching to a longer period reduces your effective monthly cost.
            Changes take effect through your billing portal.
          </p>
          <div className="sub-cadence-display">
            {PRO_CADENCE_OPTIONS.map((c) => (
              <div key={c.key} className="sub-cadence-item">
                {c.savingsNote && (
                  <span className="cadence-savings-badge">{c.savingsNote}</span>
                )}
                <span className="sub-cadence-label">{c.label}</span>
                <div className="cadence-option-pricing">
                  <span className="cadence-option-price">{c.price}</span>
                  <span className="cadence-option-period">{c.period}</span>
                </div>
                {c.perMonthNote && (
                  <span className="cadence-option-per-month">{c.perMonthNote}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Link
              className="button button-secondary"
              href={settingsData.subscriptionSummary.upgradeHref}
            >
              Switch billing period
            </Link>
          </div>
        </section>
      )}

      {/* ── Free: plan comparison + upgrade ── */}
      {!isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">Choose your plan</h2>
          </div>
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            Your plan defines which model pools are available and your monthly allowances.
          </p>

          <div className="sub-plan-compare">
            {/* Free column */}
            <div className="sub-plan-col current">
              <div className="sub-plan-col-head">
                <div className="sub-plan-col-title-row">
                  <span className="sub-plan-col-name">Free</span>
                  <span className="sub-plan-current-badge">Your plan</span>
                </div>
                <span className="sub-plan-price">$0</span>
              </div>
              <ul className="sub-plan-feature-list">
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>Standard text models</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>Standard image models</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>10 image generations / month</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>15 audio minutes / month</span>
                </li>
              </ul>
            </div>

            {/* Pro column */}
            <div className="sub-plan-col featured">
              <div className="sub-plan-col-head">
                <div className="sub-plan-col-title-row">
                  <span className="sub-plan-col-name">Pro</span>
                  <span className="sub-plan-recommended-badge">Recommended</span>
                </div>
                <span className="sub-plan-price">from $14.99<span className="sub-plan-price-period"> / mo</span></span>
              </div>
              <ul className="sub-plan-feature-list">
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>Premium text models</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>Premium image models</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>80 image generations / month</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>120 audio minutes / month</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>Credits for extended usage</span>
                </li>
              </ul>
              <div className="sub-plan-upgrade-area">
                <BillingCadenceSelector checkoutHref={checkoutHref} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Credits ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">Credits</h2>
        </div>
        <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
          {isPro
            ? "Credits extend image and audio usage after your monthly allowances are used."
            : "Credits extend image and audio usage after monthly allowances are used. Available to Pro members."}
        </p>
        <div className="sub-credits-row">
          <div className="sub-credits-facts">
            <div className="sub-credits-fact">
              <span className="settings-meta-label">Image overage</span>
              <span className="settings-meta-value">2–4 credits / image</span>
            </div>
            <div className="sub-credits-fact">
              <span className="settings-meta-label">Audio overage</span>
              <span className="settings-meta-value">3–5 credits / minute</span>
            </div>
          </div>
          <Link
            className="button button-secondary"
            href={`/app/credits${roleQuerySuffix}`}
          >
            View credits & packs
          </Link>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
