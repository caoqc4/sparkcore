import Link from "next/link";
import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { SiteShell, PageFrame } from "@/components/site-shell";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getPricingCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "Pricing: Free & Pro AI Companion Plans",
      "zh-CN": "定价：免费版与 Pro AI 伴侣方案",
    },
    description: {
      en: "Lagun offers a free plan and a Pro plan starting at $14.99/mo. Memory visibility, IM channel access, and relationship continuity are included in both.",
      "zh-CN": "Lagun 提供免费版和起价 $14.99/月 的 Pro 版。两个方案都包含记忆可见性、IM 渠道接入和关系连续性。",
    },
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getPricingCopy(contentLanguage);

  return (
    <SiteShell>
      <PageFrame
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="pricing-plans">
          {/* Free plan */}
          <div className="pricing-plan">
            <div className="pricing-plan-head">
              <span className="pricing-plan-name">{copy.free}</span>
              <div className="pricing-plan-price">
                <span className="pricing-price-amount">$0</span>
              </div>
              <p className="pricing-plan-desc">{copy.freeDesc}</p>
            </div>
            <ul className="pricing-feature-list">
              {copy.freeFeatures.map((f) => (
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
                  anonymous: copy.startFree,
                  signed_in_empty: copy.startFree,
                  signed_in_role_only: copy.onFree,
                  signed_in_connected: copy.onFree,
                }}
              >
                {copy.startFree}
              </AdaptiveTrackedLink>
            </div>
          </div>

          {/* Pro plan */}
          <div className="pricing-plan pricing-plan-featured">
            <div className="pricing-plan-head">
              <div className="pricing-plan-name-row">
                <span className="pricing-plan-name">{copy.pro}</span>
                <span className="pricing-recommended-badge">{copy.recommended}</span>
              </div>
              <div className="pricing-cadence-list">
                {copy.cadences.map((c) => (
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
              <p className="pricing-plan-desc">{copy.proDesc}</p>
            </div>
            <ul className="pricing-feature-list">
              {copy.proFeatures.map((f) => (
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
                  anonymous: copy.getStarted,
                  signed_in_empty: copy.createCompanion,
                  signed_in_role_only: copy.upgrade,
                  signed_in_connected: copy.upgrade,
                }}
              >
                {copy.getStarted}
              </AdaptiveTrackedLink>
            </div>
          </div>
        </div>

        <div className="pricing-footnote">
          <p>{copy.footnote}</p>
          <Link className="site-inline-link" href="/faq">{copy.faq}</Link>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
