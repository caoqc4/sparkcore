import { PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getPrivacyCopy } from "@/lib/i18n/legal-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Privacy Policy", "zh-CN": "隐私政策" },
    description: {
      en: "Lagun privacy policy — how we collect, use, and protect your personal data in our IM-native AI companion product.",
      "zh-CN": "Lagun 隐私政策：我们如何在 IM 原生 AI 伴侣产品中收集、使用和保护你的个人数据。",
    },
    path: "/privacy"
  });
}

export default async function PrivacyPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getPrivacyCopy(contentLanguage);
  const labeledBulletSeparator = contentLanguage === "zh-CN" ? "：" : ": ";

  return (
    <SiteShell>
      <PageFrame
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="prose prose-invert max-w-none">
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={`${bullet.label ?? ""}${bullet.text}`}>
                      {bullet.label ? <strong>{bullet.label}</strong> : null}
                      {bullet.label ? labeledBulletSeparator : ""}
                      {bullet.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="toolbar">
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/terms"
            payload={{ source: "privacy_terms" }}
          >
            {copy.links.primary}
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/privacy-controls"
            payload={{ source: "privacy_controls" }}
          >
            {copy.links.secondary}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
