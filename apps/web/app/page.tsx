import { ProductRoleSetup } from "@/components/product-role-setup";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getOptionalUser();
  const supabase = user ? await createClient() : null;
  const overview =
    user && supabase
      ? await loadDashboardOverview({
          supabase,
          userId: user.id
        })
      : null;

  const hasExistingRole = Boolean(overview?.currentRole);

  return (
    <SiteShell>
      <section className="home-stage">
        <div className="home-stage-copy">
          <p className="home-kicker">Relationship-first companion product</p>
          <h1 className="home-display">
            Create the role once. Let the relationship continue in IM.
          </h1>
          <p className="home-lead">
            SparkCore is not another browser chat toy. It is a long-memory
            companion flow with IM as the daily surface and the website as the
            control center for memory, profile, privacy, and continuity.
          </p>

          <div className="home-proof-strip">
            <div className="home-proof-chip">
              <span>Long memory</span>
              <strong>Visible and repairable</strong>
            </div>
            <div className="home-proof-chip">
              <span>IM-native loop</span>
              <strong>Carry the relationship outside the browser</strong>
            </div>
            <div className="home-proof-chip">
              <span>Control center</span>
              <strong>Profile, channels, privacy, and supplementary chat</strong>
            </div>
          </div>
        </div>

        {hasExistingRole && overview ? (
          <section className="home-continue-shell">
            <div className="site-inline-pill">{overview.relationshipSummary.label}</div>
            <h2>Welcome back to {overview.currentRole?.name}.</h2>
            <p className="home-continue-copy">
              {overview.relationshipSummary.body}
            </p>

            <div className="home-continue-stats">
              <article className="home-continue-stat">
                <span>Current role</span>
                <strong>{overview.currentRole?.name}</strong>
              </article>
              <article className="home-continue-stat">
                <span>Active memories</span>
                <strong>{overview.memorySummary.active}</strong>
              </article>
              <article className="home-continue-stat">
                <span>Live channels</span>
                <strong>{overview.channelSummary.active}</strong>
              </article>
            </div>

            <div className="home-continue-next">
              <p className="home-continue-next-label">Best next step</p>
              <h3>{overview.nextStep.title}</h3>
              <p>{overview.nextStep.body}</p>
            </div>

            <div className="toolbar">
              <TrackedLink
                className="button button-primary button-large"
                event="landing_cta_click"
                href={overview.nextStep.href}
                payload={{ source: "home_existing_role_primary" }}
              >
                Continue relationship flow
              </TrackedLink>
              <TrackedLink
                className="button button-ghost button-large"
                event="landing_cta_click"
                href="/dashboard"
                payload={{ source: "home_existing_role_dashboard" }}
              >
                Open dashboard
              </TrackedLink>
            </div>

            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/create"
              payload={{ source: "home_existing_role_create_another" }}
            >
              Create another role
            </TrackedLink>
          </section>
        ) : (
          <section className="home-setup-shell">
            <div className="home-setup-heading">
              <p className="home-kicker">Create</p>
              <h2>Create your companion and move straight into IM setup.</h2>
              <p>
                Browsing stays public. Submission is gated by login. Once the
                role exists, the flow hands off into IM setup and then returns
                you to the relationship control center.
              </p>
            </div>

            <ProductRoleSetup
              loginNext="/"
              reviewHref="/how-it-works"
              shellClassName="product-role-shell product-role-shell-home"
              surface="home_hero"
              user={user ? { id: user.id } : null}
            />
          </section>
        )}
      </section>

      <section className="home-ribbon">
        <div className="home-ribbon-copy">
          <p className="home-kicker">Why it feels different</p>
          <h2>
            Less like a generic chatbox. More like a designed product loop.
          </h2>
        </div>

        <div className="home-ribbon-grid">
          <article className="home-ribbon-card">
            <span>01</span>
            <h3>Memory stays inspectable</h3>
            <p>
              You can see what the system retained, where it came from, and
              repair it instead of trusting a hidden blob.
            </p>
          </article>
          <article className="home-ribbon-card">
            <span>02</span>
            <h3>IM stays the daily surface</h3>
            <p>
              The main rhythm belongs in Telegram-style channels instead of
              forcing every conversation back into the browser.
            </p>
          </article>
          <article className="home-ribbon-card">
            <span>03</span>
            <h3>Web stays the control center</h3>
            <p>
              Return here to tune the role core, audit memory, manage channels,
              review privacy, and continue the same thread when needed.
            </p>
          </article>
        </div>
      </section>

      <section className="home-editorial-grid">
        <article className="home-editorial-panel home-editorial-panel-dark">
          <p className="home-kicker">Choose your entry</p>
          <h2>Start from the promise that matches why you came here.</h2>
          <p>
            The site should feel like a polished landing experience, but the
            destination stays product-led: companion, girlfriend, or roleplay as
            an entry into one relationship system.
          </p>
          <div className="home-editorial-links">
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/ai-companion"
              payload={{ source: "home_entry_companion" }}
            >
              Explore AI companion
            </TrackedLink>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/ai-girlfriend"
              payload={{ source: "home_entry_girlfriend" }}
            >
              Explore AI girlfriend
            </TrackedLink>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/ai-boyfriend"
              payload={{ source: "home_entry_boyfriend" }}
            >
              Explore AI boyfriend
            </TrackedLink>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/ai-roleplay-chat"
              payload={{ source: "home_entry_roleplay" }}
            >
              Explore AI roleplay chat
            </TrackedLink>
          </div>
        </article>

        <article className="home-editorial-panel">
          <p className="home-kicker">High-intent alternatives</p>
          <h2>Comparison pages for users already looking to switch.</h2>
          <p>
            We now meet Character.AI and Replika search intent with
            comparison-led landings instead of trying to explain the whole
            product from scratch every time.
          </p>
          <div className="home-editorial-links">
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/alternatives/character-ai"
              payload={{ source: "home_alt_character_ai" }}
            >
              Character.AI alternative
            </TrackedLink>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/alternatives/replika"
              payload={{ source: "home_alt_replika" }}
            >
              Replika alternative
            </TrackedLink>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
