import { PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getTermsCopy } from "@/lib/i18n/legal-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Terms of Service", "zh-CN": "服务条款" },
    description: {
      en: "Lagun terms of service — the rules and conditions that govern use of our IM-native AI companion platform.",
      "zh-CN": "Lagun 服务条款：约束你使用我们 IM 原生 AI 伴侣平台的规则与条件。",
    },
    path: "/terms"
  });
}

export default async function TermsPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getTermsCopy(contentLanguage);

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
                      {bullet.label ? ": " : ""}
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
            href="/privacy"
            payload={{ source: "terms_privacy" }}
          >
            {copy.links.primary}
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/safety"
            payload={{ source: "terms_safety" }}
          >
            {copy.links.secondary}
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
