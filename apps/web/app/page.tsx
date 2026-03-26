import {
  FeatureCardGrid,
  MarketingHero,
  SiteShell
} from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";

export default function HomePage() {
  return (
    <SiteShell>
      <MarketingHero
        eyebrow="IM-native companion"
        title="AI companion that remembers you and stays with you in IM."
        description="SparkCore is building a relationship-first companion product on top of a long-memory core. IM carries the daily conversation. The website acts as the control center for memory, channels, and continuity."
        aside={
          <div className="site-hero-stack">
            <div className="site-inline-pill">Batch 1 public shell</div>
            <h2>Two product promises, one center of gravity</h2>
            <ul className="site-bullet-list">
              <li>Long memory that users can inspect and repair</li>
              <li>IM-native interaction instead of browser-first chat</li>
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/create"
              payload={{ source: "home_hero" }}
            >
              Create your companion
            </TrackedLink>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/memory-center"
              payload={{ source: "home_memory_link" }}
            >
              Explore memory center
            </TrackedLink>
          </div>
        }
      />

      <section className="site-section">
        <div className="site-section-copy">
          <p className="eyebrow">Why SparkCore</p>
          <h2 className="section-title">
            Public site for trust and conversion. Product shell for relationship
            control.
          </h2>
        </div>

        <FeatureCardGrid
          items={[
            {
              title: "Long-memory relationship",
              body: "The companion is designed to feel like the same presence over time, backed by visible long-term state."
            },
            {
              title: "Website as control center",
              body: "The website is where you configure the role, inspect memory, manage channels, and later tune privacy."
            },
            {
              title: "IM as the main surface",
              body: "The main interaction loop belongs in IM, where daily conversation is lighter and more habitual."
            }
          ]}
        />
      </section>

      <section className="site-section site-section-accent">
        <div className="site-card-grid">
          <article className="site-card">
            <p className="eyebrow">Step 1</p>
            <h2>Create your companion</h2>
            <p>
              Start from a relationship-first mode and shape the initial role
              core without turning setup into a heavy builder.
            </p>
          </article>
          <article className="site-card">
            <p className="eyebrow">Step 2</p>
            <h2>Connect your IM</h2>
            <p>
              Bind the companion to the channel where the main relationship loop
              can actually continue.
            </p>
          </article>
          <article className="site-card">
            <p className="eyebrow">Step 3</p>
            <h2>Return to the control center</h2>
            <p>
              Review memory, relationship state, and channels without forcing
              every conversation back into the browser.
            </p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
