import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getImChatFeatureCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion via IM Chat: Beyond the Browser",
      "zh-CN": "IM 原生 AI 伴侣：把关系建立在浏览器之外",
    },
    description: {
      en: "Understand why Lagun keeps the main companion relationship in IM while the website stays focused on setup, memory, and control.",
      "zh-CN": "理解为什么 Lagun 把主要伴侣关系放在 IM 中，而网站则专注于设置、记忆和控制。",
    },
    keywords: ["ai companion im chat", "im ai chat", "ai in telegram", "ai companion outside browser"],
    path: "/features/im-chat"
  });
}

export default async function ImChatFeaturePage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getImChatFeatureCopy(contentLanguage);

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
            payload={{ source: "feature_im_create" }}
            intent="im_action"
            labels={{
              anonymous: copy.create,
              signed_in_empty: copy.firstRole,
              signed_in_role_only: copy.connectIm,
              signed_in_connected: copy.openChat
            }}
          >
            {copy.create}
          </AdaptiveTrackedLink>
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "feature_im_connect" }}
            intent="im_action"
            labels={{
              anonymous: copy.secondary,
              signed_in_empty: copy.firstRole,
              signed_in_role_only: copy.connectIm,
              signed_in_connected: copy.openChat
            }}
          >
            {copy.secondary}
          </AdaptiveTrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
