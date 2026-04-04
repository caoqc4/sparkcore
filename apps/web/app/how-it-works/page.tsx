import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getHowItWorksCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "How It Works", "zh-CN": "工作原理" },
    description: {
      en: "See the Lagun loop from role creation to IM connection to memory and privacy control on the web.",
      "zh-CN": "查看 Lagun 从角色创建、IM 连接到网页上的记忆与隐私控制的完整循环。",
    },
    path: "/how-it-works"
  });
}

export default async function HowItWorksPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getHowItWorksCopy(contentLanguage);

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
            payload={{ source: "how_it_works_create" }}
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
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "how_it_works_im_chat" }}
            intent="im_chat"
            labels={{
              anonymous: copy.seeIm,
              signed_in_empty: copy.createRoleFirst,
              signed_in_role_only: copy.connectIm,
              signed_in_connected: copy.openChat
            }}
          >
            {copy.seeIm}
          </AdaptiveTrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/memory-center"
            payload={{ source: "how_it_works_memory_center" }}
          >
            {copy.memoryCenter}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
