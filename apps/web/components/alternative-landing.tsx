import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getAlternativeLandingChromeCopy } from "@/lib/i18n/alternative-page-copy";
import { getSiteLanguageState } from "@/lib/i18n/site";

type ComparisonRow = {
  label: string;
  sparkcore: string;
  alternative: string;
};

type RivalProfile = {
  summary: string;
  strengths: Array<{ title: string; body: string }>;
};

type AlternativeLandingProps = {
  rival: string;
  eyebrow: string;
  title: string;
  description: string;
  rivalProfile: RivalProfile;
  switchReasons: string[];
  comparisonRows: ComparisonRow[];
  migrationFit: Array<{
    title: string;
    body: string;
  }>;
  closingTitle: string;
  closingBody: string;
};

export async function AlternativeLanding({
  rival,
  eyebrow,
  title,
  description,
  rivalProfile,
  switchReasons,
  comparisonRows,
  migrationFit,
  closingTitle,
  closingBody,
}: AlternativeLandingProps) {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getAlternativeLandingChromeCopy(contentLanguage);

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
                href="/how-it-works"
                payload={{ source: `${rivalSlug}_alternative_how_it_works` }}
              >
                {copy.howItWorks}
              </TrackedLink>
            </div>
          </div>

          <aside className="alternative-proof">
            <p className="eyebrow">{copy.whySwitch}</p>
            <ul className="site-bullet-list alternative-bullets">
              {copy.switchBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>

        <section className="alternative-section">
          <div className="site-section-copy">
            <p className="eyebrow">{copy.about(rival)}</p>
            <h2 className="section-title">{copy.whatDoesWell(rival)}</h2>
            <p className="lead">{rivalProfile.summary}</p>
          </div>
          <div className="site-card-grid">
            {rivalProfile.strengths.map((item) => (
              <article className="site-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="alternative-section">
          <div className="site-section-copy">
            <p className="eyebrow">{copy.whyAlternatives}</p>
            <h2 className="section-title">{copy.whyAlternativesTitle}</h2>
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
            <p className="eyebrow">{copy.coreComparison}</p>
            <h2 className="section-title">{copy.coreComparisonTitle}</h2>
          </div>

          <div className="alternative-compare-table" role="table" aria-label={`Lagun vs ${rival}`}>
            <div className="alternative-compare-head" role="row">
              <span role="columnheader">{copy.comparisonCategory}</span>
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
            <p className="eyebrow">{copy.fits}</p>
            <h2 className="section-title">{copy.fitsTitle}</h2>
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
            <p className="eyebrow">{copy.closingEyebrow}</p>
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
              payload={{ source: `${rivalSlug}_alternative_footer_connect_im` }}
              intent="im_chat"
              labels={{
                anonymous: copy.connectInIm,
                signed_in_empty: copy.createRoleFirst,
                signed_in_role_only: copy.connectIm,
                signed_in_connected: copy.openChat
              }}
            >
              {copy.connectInIm}
            </AdaptiveTrackedLink>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
