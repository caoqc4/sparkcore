import type { Metadata } from "next";
import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getAiBoyfriendCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Boyfriend With Memory and IM-Native Continuity",
      "zh-CN": "带记忆与 IM 连续性的 AI 男友",
    },
    description: {
      en: "Lagun frames AI boyfriend as an ongoing relationship experience with long memory, IM-native contact, and visible web controls.",
      "zh-CN": "Lagun 将 AI 男友定义为一段持续中的关系体验，具备长期记忆、IM 原生联系能力和可见网页控制层。",
    },
    path: "/ai-boyfriend"
  });
}

export default async function AiBoyfriendPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getAiBoyfriendCopy(contentLanguage);
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
            payload={{ source: "ai_boyfriend_create" }}
            intent="create_boyfriend"
            labels={{
              anonymous: copy.create,
              signed_in_empty: copy.create,
              signed_in_role_only: copy.continue,
              signed_in_connected: copy.continue
            }}
          >
            {copy.create}
          </AdaptiveTrackedLink>
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "ai_boyfriend_im" }}
            intent="im_chat"
            labels={{
              anonymous: copy.imHow,
              signed_in_empty: copy.roleFirst,
              signed_in_role_only: copy.connectIm,
              signed_in_connected: copy.openChat
            }}
          >
            {copy.imHow}
          </AdaptiveTrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-companion"
            payload={{ source: "ai_boyfriend_to_companion" }}
          >
            {copy.companionOverview}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
