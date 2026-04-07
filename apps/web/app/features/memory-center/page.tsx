import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getMemoryCenterFeatureCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion Memory Center: Visible Long-Term Memory",
      "zh-CN": "面向长期 AI 伴侣关系的记忆中心",
    },
    description: {
      en: "See how Lagun memory center makes long-term AI companion memory visible, correctable, and trustworthy enough to support relationship continuity.",
      "zh-CN": "了解 Lagun 的记忆中心如何让长期 AI 伴侣记忆保持可见、可修正，并足够可信以支撑关系连续性。",
    },
    keywords: ["ai companion memory", "ai long term memory", "ai girlfriend memory", "persistent ai memory"],
    path: "/features/memory-center"
  });
}

export default async function MemoryCenterFeaturePage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getMemoryCenterFeatureCopy(contentLanguage);

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
            payload={{ source: "feature_memory_create" }}
            intent="memory_action"
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
            href="/ai-companion"
            payload={{ source: "feature_memory_companion" }}
          >
            {copy.tertiary}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
