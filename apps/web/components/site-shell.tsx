import Link from "next/link";
import { AdaptiveLink } from "@/components/adaptive-link";
import { ViewerShellProvider } from "@/components/viewer-shell-provider";
import { siteConfig } from "@/lib/site";

type SiteShellProps = {
  children: React.ReactNode;
};

const footerGroups = [
  {
    title: "Landing",
    links: [
      { href: "/#home-memory", label: "Memory" },
      { href: "/#home-im-chat", label: "IM Chat" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Blog",
    links: [
      { href: "/blog", label: "Blog home" },
      { href: "/alternatives/character-ai", label: "Character.AI Alternative" },
      { href: "/alternatives/replika", label: "Replika Alternative" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/ai-companion", label: "AI Companion" },
      { href: "/features/memory-center", label: "Memory Guide" },
      { href: "/features/im-chat", label: "IM Chat Guide" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/how-it-works", label: "How It Works" },
      { href: "/features/privacy-controls", label: "Privacy" },
      { href: "/safety", label: "Safety" },
      { href: "/faq", label: "FAQ" },
    ],
  },
] as const;

export function SiteShell({ children }: SiteShellProps) {
  return (
    <ViewerShellProvider>
      <div className="site-shell">
        <header className="site-header">
          <div className="site-header-inner">
            <Link className="site-brand" href="/">
              <span className="site-brand-mark">SC</span>
              <span className="site-brand-lockup">
                <strong>{siteConfig.name}</strong>
                <span className="site-brand-copy">
                  Relationship operating system
                </span>
              </span>
            </Link>

            <nav className="site-nav" aria-label="Primary">
              <Link href="/#home-im-chat">IM Chat</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/blog">Blog</Link>
            </nav>

            <div className="site-actions">
              <AdaptiveLink
                className="button button-secondary site-action-link"
                intent="dashboard"
                labels={{
                  anonymous: "Sign in",
                  signed_in_empty: "Console",
                  signed_in_role_only: "Console",
                  signed_in_connected: "Console",
                }}
              />
              <AdaptiveLink
                className="button site-action-link"
                intent="primary_flow"
                labels={{
                  anonymous: "Create yours",
                  signed_in_empty: "Create role",
                  signed_in_role_only: "Continue flow",
                  signed_in_connected: "Continue flow",
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
                  <span className="site-brand-mark">SC</span>
                  <span className="site-brand-lockup">
                    <strong>{siteConfig.name}</strong>
                    <span className="site-brand-copy">
                      Long-memory companion
                    </span>
                  </span>
                </Link>
                <p className="site-footer-copy">
                  SparkCore packages one persistent relationship loop across
                  role setup, IM continuity, memory review, and the web control
                  center.
                </p>
              </div>

              {footerGroups.map((group) => (
                <div className="site-footer-column" key={group.title}>
                  <p className="site-footer-heading">{group.title}</p>
                  <nav className="site-footer-nav" aria-label={group.title}>
                    {group.title === "Trust" ? (
                      <>
                        <Link href="/how-it-works">How It Works</Link>
                        <AdaptiveLink intent="privacy">Privacy</AdaptiveLink>
                        <Link href="/blog">Blog</Link>
                        <Link href="/safety">Safety</Link>
                        <Link href="/faq">FAQ</Link>
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
              <Link href="/how-it-works">How it works</Link>
              <Link href="/blog">Blog</Link>
              <AdaptiveLink intent="privacy">Privacy</AdaptiveLink>
              <Link href="/safety">Safety</Link>
              <Link href="/faq">FAQ</Link>
              <span>Built for relationship-first companion products.</span>
            </div>
          </div>
          <div className="site-footer-wordmark" aria-hidden="true">
            SPARKCORE
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
  primaryHref = "/create",
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
