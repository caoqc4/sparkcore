import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getFaqCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion FAQ: Memory, IM Chat & Privacy",
      "zh-CN": "AI 伴侣 FAQ：记忆、IM 聊天与隐私控制",
    },
    description: {
      en: "Find answers about Lagun memory, IM-native chat, privacy controls, supported channels, and how the website control center fits the product.",
      "zh-CN": "查看关于 Lagun 记忆、IM 原生聊天、隐私控制、支持渠道以及网页控制中心定位的答案。",
    },
    keywords: ["ai companion faq", "ai girlfriend faq", "ai companion questions"],
    path: "/faq"
  });
}

export default async function FaqPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getFaqCopy(contentLanguage);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: { "@type": "Answer", text: item.body },
    })),
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
            payload={{ source: "faq_create" }}
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
            href="/features/memory-center"
            payload={{ source: "faq_memory_center" }}
          >
            {copy.memory}
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/privacy-controls"
            payload={{ source: "faq_privacy_controls" }}
          >
            {copy.privacy}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
