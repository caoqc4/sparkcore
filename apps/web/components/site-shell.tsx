import Link from "next/link";
import { AdaptiveLink } from "@/components/adaptive-link";
import { ContentLanguageSwitcher } from "@/components/content-language-switcher";
import { SiteNav } from "@/components/site-nav";
import { ViewerShellProvider } from "@/components/viewer-shell-provider";
import { getSiteLanguageState, getSiteChromeCopy } from "@/lib/i18n/site";
import { siteConfig } from "@/lib/site";

type SiteShellProps = {
  children: React.ReactNode;
};

export async function SiteShell({ children }: SiteShellProps) {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getSiteChromeCopy(contentLanguage);
  const footerGroups = [
    {
      title: copy.marketing.footerGroups.landing,
      links: [
        { href: "/#home-memory", label: copy.marketing.footerLinks.memory },
        { href: "/#home-im-chat", label: copy.marketing.footerLinks.imChat },
        { href: "/#home-faq", label: copy.marketing.footerLinks.faq },
      ],
    },
    {
      title: copy.marketing.footerGroups.blog,
      links: [
        { href: "/blog", label: copy.marketing.footerLinks.blogHome },
        {
          href: "/alternatives/character-ai",
          label: copy.marketing.footerLinks.characterAiAlt,
        },
        {
          href: "/alternatives/replika",
          label: copy.marketing.footerLinks.replikaAlt,
        },
      ],
    },
    {
      title: copy.marketing.footerGroups.product,
      links: [
        { href: "/ai-companion", label: copy.marketing.footerLinks.aiCompanion },
        { href: "/ai-girlfriend", label: copy.marketing.footerLinks.aiGirlfriend },
        { href: "/ai-roleplay-chat", label: copy.marketing.footerLinks.aiRoleplay },
        { href: "/ai-assistant", label: copy.marketing.footerLinks.aiAssistant },
        {
          href: "/features/memory-center",
          label: copy.marketing.footerLinks.memoryGuide,
        },
        { href: "/features/im-chat", label: copy.marketing.footerLinks.imGuide },
        { href: "/pricing", label: copy.marketing.footerLinks.pricing },
      ],
    },
    {
      title: copy.marketing.footerGroups.trust,
      links: [
        { href: "/how-it-works", label: copy.marketing.footerLinks.howItWorks },
        { href: "/features/privacy-controls", label: copy.marketing.footerLinks.privacy },
        { href: "/safety", label: copy.marketing.footerLinks.safety },
        { href: "/faq", label: copy.marketing.footerLinks.faq },
        { href: "/privacy", label: copy.marketing.footerLinks.privacyPolicy },
        { href: "/terms", label: copy.marketing.footerLinks.terms },
      ],
    },
  ] as const;

  return (
    <ViewerShellProvider>
      <div className="site-shell">
        <header className="site-header">
          <div className="site-header-inner">
            <Link className="site-brand" href="/">
              <span className="site-brand-mark">L</span>
              <span className="site-brand-lockup">
                <strong>{siteConfig.name}</strong>
                <span className="site-brand-copy">{copy.marketing.brandTagline}</span>
              </span>
            </Link>

            <SiteNav labels={copy.nav} />

            <div className="site-actions">
              <ContentLanguageSwitcher
                currentLanguage={contentLanguage}
                label={copy.contentSwitch.label}
                languages={{ en: "EN", "zh-CN": "中文" }}
              />
              <AdaptiveLink
                className="button button-secondary site-action-link"
                intent="dashboard"
                labels={{
                  anonymous: copy.marketing.ctas.signIn,
                  signed_in_empty: copy.marketing.ctas.console,
                  signed_in_role_only: copy.marketing.ctas.console,
                  signed_in_connected: copy.marketing.ctas.console,
                }}
              />
            </div>
          </div>
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-grid">
              <div className="site-footer-brand-block">
                <Link className="site-brand" href="/">
                  <span className="site-brand-mark">L</span>
                  <span className="site-brand-lockup">
                    <strong>{siteConfig.name}</strong>
                    <span className="site-brand-copy">{copy.marketing.footerBrandTagline}</span>
                  </span>
                </Link>
                <p className="site-footer-copy">{copy.marketing.footerSummary}</p>
              </div>

              {footerGroups.map((group) => (
                <div className="site-footer-column" key={group.title}>
                  <p className="site-footer-heading">{group.title}</p>
                  <nav className="site-footer-nav" aria-label={group.title}>
                    {group.title === "Trust" ? (
                      <>
                        <Link href="/how-it-works">{copy.marketing.footerLinks.howItWorks}</Link>
                        <AdaptiveLink intent="privacy">
                          {copy.marketing.footerLinks.privacy}
                        </AdaptiveLink>
                        <Link href="/safety">{copy.marketing.footerLinks.safety}</Link>
                        <Link href="/faq">{copy.marketing.footerLinks.faq}</Link>
                        <Link href="/privacy">{copy.marketing.footerLinks.privacyPolicy}</Link>
                        <Link href="/terms">{copy.marketing.footerLinks.terms}</Link>
                      </>
                    ) : (
                      group.links.map((item) => (
                        <Link key={item.href} href={item.href}>
                          {item.label}
                        </Link>
                      ))
                    )}
                  </nav>
                </div>
              ))}
            </div>

            <div className="site-footer-bottom">
              <Link href="/how-it-works">{copy.marketing.footerLinks.howItWorks}</Link>
              <Link href="/pricing">{copy.marketing.footerLinks.pricing}</Link>
              <Link href="/blog">{copy.marketing.footerGroups.blog}</Link>
              <AdaptiveLink intent="privacy">{copy.marketing.footerLinks.privacy}</AdaptiveLink>
              <Link href="/safety">{copy.marketing.footerLinks.safety}</Link>
              <Link href="/faq">{copy.marketing.footerLinks.faq}</Link>
              <Link href="/privacy">{copy.marketing.footerLinks.privacyPolicy}</Link>
              <Link href="/terms">{copy.marketing.footerLinks.terms}</Link>
              <span>{copy.marketing.footerBuiltFor}</span>
            </div>
          </div>
          <div className="site-footer-wordmark" aria-hidden="true">
            LAGUN
          </div>
        </footer>
      </div>
    </ViewerShellProvider>
  );
}

type MarketingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  aside?: React.ReactNode;
};

export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref = "/",
  primaryLabel = "Create your companion",
  secondaryHref = "/how-it-works",
  secondaryLabel = "See how it works",
  aside,
}: MarketingHeroProps) {
  return (
    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
        <p className="lead">{description}</p>
        <div className="hero-actions">
          <Link className="button" href={primaryHref}>
            {primaryLabel}
          </Link>
          <Link className="button button-secondary" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        </div>
      </div>

      <div className="marketing-hero-panel">{aside}</div>
    </section>
  );
}

type PageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PageFrame({
  eyebrow,
  title,
  description,
  children,
}: PageFrameProps) {
  return (
    <section className="page-frame">
      <div className="page-frame-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
        <p className="lead">{description}</p>
      </div>
      <div className="page-frame-body">{children}</div>
    </section>
  );
}

type FeatureCardGridProps = {
  items: Array<{
    title: string;
    body: string;
  }>;
};

export function FeatureCardGrid({ items }: FeatureCardGridProps) {
  return (
    <div className="site-card-grid">
      {items.map((item, index) => (
        <article className="site-card" key={item.title}>
          <span className="site-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

type ProtectedPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep?: string;
};

export function ProtectedPlaceholder({
  eyebrow,
  title,
  description,
  nextStep,
}: ProtectedPlaceholderProps) {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
        <p className="lead">{description}</p>
        {nextStep ? (
          <div className="notice notice-warning">{nextStep}</div>
        ) : null}
      </section>
    </main>
  );
}
