import Link from "next/link";
import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { SiteShell, PageFrame } from "@/components/site-shell";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "Lagun offers a free plan and a Pro plan starting at $14.99/mo. Memory visibility, IM channel access, and relationship continuity are included in both.",
  path: "/pricing",
});

const FREE_FEATURES = [
  "Standard text model for companion chat",
  "Standard image model for companion portraits",
  "10 image generations per month",
  "15 audio minutes per month",
  "Long-memory center with inspect and repair",
  "IM channel connection (Telegram, WeChat, etc.)",
];

const PRO_FEATURES = [
  "Premium text model — higher quality responses",
  "Premium image model — higher quality portraits",
  "80 image generations per month",
  "120 audio minutes per month",
  "Credits for extended image and audio usage",
  "Everything in Free",
];

const PRO_CADENCES = [
  { label: "Monthly", price: "$14.99", period: "/ mo", note: null, badge: null },
  { label: "Quarterly", price: "$39.99", period: "/ qtr", note: "~$13.33 / mo", badge: "Save 11%" },
  { label: "Yearly", price: "$99.99", period: "/ yr", note: "~$8.33 / mo", badge: "Save 44%" },
];

export default function PricingPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Pricing"
        title="One free plan. One Pro plan. No hidden tiers."
        description="Both plans include long-memory and IM channel access. Pro unlocks premium models and higher monthly allowances."
      >
        <div className="pricing-plans">
          {/* Free plan */}
          <div className="pricing-plan">
            <div className="pricing-plan-head">
              <span className="pricing-plan-name">Free</span>
              <div className="pricing-plan-price">
                <span className="pricing-price-amount">$0</span>
              </div>
              <p className="pricing-plan-desc">Start building a relationship. Memory and IM are included at no cost.</p>
            </div>
            <ul className="pricing-feature-list">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="pricing-plan-action">
              <AdaptiveTrackedLink
                className="button button-secondary"
                event="landing_cta_click"
                payload={{ source: "pricing_free_cta" }}
                intent="create_companion"
                labels={{
                  anonymous: "Start free",
                  signed_in_empty: "Start free",
                  signed_in_role_only: "You're on Free",
                  signed_in_connected: "You're on Free",
                }}
              >
                Start free
              </AdaptiveTrackedLink>
            </div>
          </div>

          {/* Pro plan */}
          <div className="pricing-plan pricing-plan-featured">
            <div className="pricing-plan-head">
              <div className="pricing-plan-name-row">
                <span className="pricing-plan-name">Pro</span>
                <span className="pricing-recommended-badge">Recommended</span>
              </div>
              <div className="pricing-cadence-list">
                {PRO_CADENCES.map((c) => (
                  <div key={c.label} className="pricing-cadence-item">
                    <span className="pricing-cadence-label">{c.label}</span>
                    <div className="pricing-cadence-right">
                      {c.badge && <span className="pricing-cadence-badge">{c.badge}</span>}
                      <span className="pricing-price-amount">{c.price}</span>
                      <span className="pricing-price-period">{c.period}</span>
                      {c.note && <span className="pricing-cadence-note">{c.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="pricing-plan-desc">More model power and higher monthly allowances for an active relationship loop.</p>
            </div>
            <ul className="pricing-feature-list">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="pricing-feature">
                  <span className="pricing-check pricing-check-pro">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="pricing-plan-action">
              <AdaptiveTrackedLink
                className="button"
                event="landing_cta_click"
                payload={{ source: "pricing_pro_cta" }}
                intent="create_companion"
                labels={{
                  anonymous: "Get started",
                  signed_in_empty: "Create your companion",
                  signed_in_role_only: "Upgrade to Pro",
                  signed_in_connected: "Upgrade to Pro",
                }}
              >
                Get started
              </AdaptiveTrackedLink>
            </div>
          </div>
        </div>

        <div className="pricing-footnote">
          <p>All plans include long-memory, IM channel connection, and the web control center. Credits for extended image and audio usage are available on Pro.</p>
          <Link className="site-inline-link" href="/faq">Common questions about plans and credits →</Link>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
