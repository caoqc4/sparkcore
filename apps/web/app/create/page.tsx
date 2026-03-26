import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { MarketingHero, SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { createProductRole } from "@/app/create/actions";

type CreatePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();

  return (
    <SiteShell>
      <section className="page-frame">
        <div className="page-frame-header">
          <p className="eyebrow">Create</p>
          <h1 className="title">Create your companion and move straight into IM setup.</h1>
          <p className="lead">
            This flow now creates a real role and a real canonical thread. Browsing
            stays public, but submission is gated by login.
          </p>
          {!user ? (
            <div className="notice notice-warning">
              You can review the setup form now. Sign in is required when you submit.
            </div>
          ) : null}
          {params.error ? (
            <div className="notice notice-error">{params.error}</div>
          ) : null}
        </div>

        <div className="page-frame-body">
          <section className="site-card">
            <h2>Setup</h2>
            <form action={createProductRole} className="stack">
              <div className="field">
                <label className="label" htmlFor="mode">
                  Mode
                </label>
                <select className="input" id="mode" name="mode" defaultValue="companion">
                  <option value="companion">Companion</option>
                  <option value="girlfriend">Girlfriend</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input className="input" id="name" name="name" placeholder="Luna" />
              </div>

              <div className="field">
                <label className="label" htmlFor="tone">
                  Tone
                </label>
                <select className="input" id="tone" name="tone" defaultValue="warm">
                  <option value="warm">Warm</option>
                  <option value="playful">Playful</option>
                  <option value="steady">Steady</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="relationship_mode">
                  Relationship mode
                </label>
                <input
                  className="input"
                  id="relationship_mode"
                  name="relationship_mode"
                  defaultValue="long-term companion"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="boundaries">
                  Boundaries
                </label>
                <textarea
                  className="input"
                  id="boundaries"
                  name="boundaries"
                  rows={4}
                  defaultValue="Be supportive, respectful, and avoid manipulative or coercive behavior."
                />
              </div>

              {user ? (
                <FormSubmitButton
                  className="button"
                  eventName="create_started"
                  eventPayload={{ surface: "create_page" }}
                  idleText="Create and continue"
                  pendingText="Creating..."
                />
              ) : (
                <Link className="button site-action-link" href="/login?next=%2Fcreate">
                  Sign in to create
                </Link>
              )}
            </form>
          </section>

          <section className="marketing-hero-panel">
            <div className="site-hero-stack">
              <div className="site-inline-pill">Role core</div>
              <h2>What this creates</h2>
              <p>
                A custom agent, a canonical relationship thread, and the initial role
                core needed for the rest of the product loop.
              </p>
              <ul className="site-bullet-list">
                <li>Real agent row</li>
                <li>Real thread row</li>
                <li>Redirect into `/connect-im`</li>
              </ul>
              <Link className="site-inline-link" href="/how-it-works">
                Review the flow
              </Link>
            </div>
          </section>
        </div>
      </section>
    </SiteShell>
  );
}
