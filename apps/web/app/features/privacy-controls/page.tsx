import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getPrivacyControlsFeatureCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "Privacy Controls for Long-Memory AI Companion Products",
      "zh-CN": "面向长期记忆 AI 伴侣产品的隐私控制",
    },
    description: {
      en: "Lagun privacy controls focus on visible memory, explicit boundaries, and channel awareness so companion continuity stays inspectable.",
      "zh-CN": "Lagun 的隐私控制重点在于可见记忆、明确边界和渠道感知，让伴侣连续性保持可检查。",
    },
    path: "/features/privacy-controls"
  });
}

export default async function PrivacyControlsFeaturePage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getPrivacyControlsFeatureCopy(contentLanguage);

  return (
    <SiteShell>
      <PageFrame
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <FeatureCardGrid items={copy.items} />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "feature_privacy_create" }}
            intent="privacy_action"
            labels={{
              anonymous: copy.create,
              signed_in_empty: copy.firstRole,
              signed_in_role_only: copy.secondary,
              signed_in_connected: copy.secondary
            }}
          >
            {copy.create}
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/ai-girlfriend"
            payload={{ source: "feature_privacy_girlfriend" }}
          >
            {copy.tertiary}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
