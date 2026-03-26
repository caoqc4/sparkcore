import Link from "next/link";
import { siteConfig } from "@/lib/site";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/">
            <span className="site-brand-mark">SC</span>
            <span>
              <strong>{siteConfig.name}</strong>
              <span className="site-brand-copy">Long-memory companion</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {siteConfig.nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-actions">
            <Link className="button button-secondary site-action-link" href="/login">
              Sign in
            </Link>
            <Link className="button site-action-link" href="/create">
              Create yours
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="eyebrow">SparkCore</p>
            <p className="site-footer-copy">
              Relationship-first AI companion with long memory and an IM-native
              experience.
            </p>
          </div>

          <nav className="site-footer-nav" aria-label="Footer">
            {siteConfig.footer.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
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
  aside
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
  children
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
      {items.map((item) => (
        <article className="site-card" key={item.title}>
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
  nextStep
}: ProtectedPlaceholderProps) {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
        <p className="lead">{description}</p>
        {nextStep ? <div className="notice notice-warning">{nextStep}</div> : null}
      </section>
    </main>
  );
}

