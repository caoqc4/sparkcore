import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getSafetyCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Safety", "zh-CN": "安全" },
    description: {
      en: "Lagun safety focuses on relationship boundaries, manageable memory, and visible web controls for IM-native companion experiences.",
      "zh-CN": "Lagun 的安全设计聚焦于关系边界、可管理记忆和面向 IM 原生伴侣体验的可见网页控制。",
    },
    path: "/safety"
  });
}

export default async function SafetyPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getSafetyCopy(contentLanguage);

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
            payload={{ source: "safety_create" }}
            intent="create_companion"
            labels={{
              anonymous: copy.create,
              signed_in_empty: copy.create,
              signed_in_role_only: copy.continue,
              signed_in_connected: copy.continue
            }}
          >
            {copy.create}
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/features/privacy-controls"
            payload={{ source: "safety_privacy_controls" }}
          >
            {copy.privacy}
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/faq"
            payload={{ source: "safety_faq" }}
          >
            {copy.faq}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
