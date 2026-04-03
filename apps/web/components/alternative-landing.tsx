"use client";

import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";

type ComparisonRow = {
  label: string;
  sparkcore: string;
  alternative: string;
};

type AlternativeLandingProps = {
  rival: string;
  eyebrow: string;
  title: string;
  description: string;
  switchReasons: string[];
  comparisonRows: ComparisonRow[];
  migrationFit: Array<{
    title: string;
    body: string;
  }>;
  closingTitle: string;
  closingBody: string;
};

export function AlternativeLanding({
  rival,
  eyebrow,
  title,
  description,
  switchReasons,
  comparisonRows,
  migrationFit,
  closingTitle,
  closingBody,
}: AlternativeLandingProps) {
  const rivalSlug = rival.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return (
    <SiteShell>
      <section className="page-frame alternative-shell">
        <div className="alternative-hero">
          <div className="alternative-hero-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="title">{title}</h1>
            <p className="lead">{description}</p>
            <div className="hero-actions">
              <AdaptiveTrackedLink
                className="button"
                event="landing_cta_click"
                payload={{ source: `${rivalSlug}_alternative_create` }}
                intent="create_companion"
                labels={{
                  anonymous: "Create your companion",
                  signed_in_empty: "Create your companion",
                  signed_in_role_only: "Continue relationship flow",
                  signed_in_connected: "Continue relationship flow"
                }}
              >
                Create your companion
              </AdaptiveTrackedLink>
              <TrackedLink
                className="button button-secondary"
                event="landing_cta_click"
                href="/how-it-works"
                payload={{ source: `${rivalSlug}_alternative_how_it_works` }}
              >
                See how it works
              </TrackedLink>
            </div>
          </div>

          <aside className="alternative-proof">
            <p className="eyebrow">Why switch</p>
            <ul className="site-bullet-list alternative-bullets">
              <li>Long memory you can inspect and repair</li>
              <li>IM-native continuity instead of app-contained chat only</li>
              <li>Relationship control on web without splitting the same bond</li>
            </ul>
          </aside>
        </div>

        <section className="alternative-section">
          <div className="site-section-copy">
            <p className="eyebrow">Why People Look For Alternatives</p>
            <h2 className="section-title">
              The switch usually starts when the relationship feels more session-like than
              continuous.
            </h2>
          </div>
          <div className="site-card-grid">
            {switchReasons.map((item) => (
              <article className="site-card" key={item}>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="alternative-section alternative-section-accent">
          <div className="site-section-copy">
            <p className="eyebrow">Core Comparison</p>
            <h2 className="section-title">This is where Lagun is intentionally different.</h2>
          </div>

          <div className="alternative-compare-table" role="table" aria-label={`Lagun vs ${rival}`}>
            <div className="alternative-compare-head" role="row">
              <span role="columnheader">Category</span>
              <span role="columnheader">Lagun</span>
              <span role="columnheader">{rival}</span>
            </div>
            {comparisonRows.map((row) => (
              <div className="alternative-compare-row" key={row.label} role="row">
                <span className="alternative-compare-label" role="cell">
                  {row.label}
                </span>
                <span className="alternative-compare-sparkcore" role="cell">
                  {row.sparkcore}
                </span>
                <span className="alternative-compare-rival" role="cell">
                  {row.alternative}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="alternative-section">
          <div className="site-section-copy">
            <p className="eyebrow">Who This Fits</p>
            <h2 className="section-title">
              Switch when you want the relationship to feel less reset and more governable.
            </h2>
          </div>
          <div className="site-card-grid">
            {migrationFit.map((item) => (
              <article className="site-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="alternative-closing">
          <div>
            <p className="eyebrow">Switch With A Stronger Loop</p>
            <h2>{closingTitle}</h2>
            <p>{closingBody}</p>
          </div>
          <div className="hero-actions">
            <AdaptiveTrackedLink
              className="button"
              event="landing_cta_click"
              payload={{ source: `${rivalSlug}_alternative_footer_create` }}
              intent="create_companion"
              labels={{
                anonymous: "Create your companion",
                signed_in_empty: "Create your companion",
                signed_in_role_only: "Continue relationship flow",
                signed_in_connected: "Continue relationship flow"
              }}
            >
              Create your companion
            </AdaptiveTrackedLink>
            <AdaptiveTrackedLink
              className="button button-secondary"
              event="landing_cta_click"
              payload={{ source: `${rivalSlug}_alternative_footer_connect_im` }}
              intent="im_chat"
              labels={{
                anonymous: "Connect in IM",
                signed_in_empty: "Create a role first",
                signed_in_role_only: "Connect an IM channel",
                signed_in_connected: "Open supplementary chat"
              }}
            >
              Connect in IM
            </AdaptiveTrackedLink>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
