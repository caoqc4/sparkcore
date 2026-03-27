import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import {
  FeatureCardGrid,
  MarketingHero,
  SiteShell
} from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "AI Roleplay Chat That Remembers You",
  description:
    "SparkCore is a relationship-first take on AI roleplay chat with persistent memory, IM continuity, and a web control center for repair and settings.",
  path: "/ai-roleplay-chat"
});

export default function AiRoleplayChatPage() {
  return (
    <SiteShell>
      <MarketingHero
        eyebrow="Roleplay Entry"
        title="AI roleplay chat that remembers you."
        description="SparkCore is not positioned as a heavy roleplay engine. It is a character-driven companion product for ongoing roleplay, relationships, and long-term conversations that can continue in IM."
        primaryHref="/create"
        primaryLabel="Create your companion"
        secondaryHref="/ai-girlfriend"
        secondaryLabel="Explore AI girlfriend"
        aside={
          <div className="site-hero-stack">
            <div className="site-inline-pill">Roleplay-flavored companion landing</div>
            <h2>For people who want character chat without losing continuity</h2>
            <ul className="site-bullet-list">
              <li>Long memory instead of constant reset</li>
              <li>Ongoing character-driven conversation in IM</li>
              <li>Web control center for memory, privacy, and channels</li>
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/ai-companion"
              payload={{ source: "roleplay_entry_companion" }}
            >
              See the companion path
            </TrackedLink>
          </div>
        }
      />

      <section className="site-section">
        <div className="site-section-copy">
          <p className="eyebrow">Why People Search Roleplay Chat</p>
          <h2 className="section-title">
            The problem usually is not “I need more characters.” It is “I want the same character
            interaction to feel less disposable.”
          </h2>
        </div>

        <FeatureCardGrid
          items={[
            {
              title: "Too much reset",
              body: "A lot of roleplay chat feels vivid in the moment, but weak at carrying shared context forward."
            },
            {
              title: "Too session-bound",
              body: "The interaction stays trapped in one browser or app surface instead of becoming part of a recurring daily loop."
            },
            {
              title: "Too little control",
              body: "Users can want more than chemistry. They also want visibility into memory, relationship continuity, and repair flows."
            }
          ]}
        />
      </section>

      <section className="site-section site-section-accent">
        <div className="site-section-copy">
          <p className="eyebrow">What Makes This Different</p>
          <h2 className="section-title">
            SparkCore treats roleplay as an entry style, then anchors it in memory, continuity, and
            relationship control.
          </h2>
        </div>

        <FeatureCardGrid
          items={[
            {
              title: "Remembers you",
              body: "The product is built around long-term memory that users can inspect, correct, and carry forward."
            },
            {
              title: "Continues in IM",
              body: "The main loop can live in IM, which makes the roleplay feel less like a browser session and more like an ongoing presence."
            },
            {
              title: "Controls on web",
              body: "Memory center, privacy surfaces, channel management, and supplementary chat keep the relationship governable."
            }
          ]}
        />
      </section>

      <section className="site-section">
        <div className="site-section-copy">
          <p className="eyebrow">Who This Fits</p>
          <h2 className="section-title">
            This page is for people who want roleplay energy, but inside a relationship-first
            product.
          </h2>
        </div>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Character chat with memory</h2>
            <p>
              A better fit when “character-driven” matters, but you also want the interaction to
              remember your story and preferences.
            </p>
          </article>
          <article className="site-card">
            <h2>Ongoing bond instead of isolated scenes</h2>
            <p>
              A better fit when you want more than short roleplay bursts and care about longer
              continuity.
            </p>
          </article>
          <article className="site-card">
            <h2>Relationship loop in IM</h2>
            <p>
              A better fit when the conversation should keep living where you already return every
              day, not only in a dedicated roleplay tab.
            </p>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="site-card-grid">
          <article className="site-card">
            <p className="eyebrow">Next Step</p>
            <h2>Start with a companion, not a heavy builder.</h2>
            <p>
              The first version of roleplay on SparkCore is still grounded in the main product:
              create a companion, connect IM, and keep the same thread going.
            </p>
            <div className="toolbar">
              <AdaptiveTrackedLink
                className="button"
                event="landing_cta_click"
                payload={{ source: "roleplay_entry_create" }}
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
                href="/ai-companion"
                payload={{ source: "roleplay_entry_ai_companion" }}
              >
                Explore AI companion
              </TrackedLink>
            </div>
          </article>
          <article className="site-card">
            <p className="eyebrow">Still Relationship-First</p>
            <h2>Roleplay is the entry semantics, not the product core.</h2>
            <p>
              That is why this page emphasizes memory, IM continuity, and a control center rather
              than promising a full roleplay engine with world management or branching scene tools.
            </p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
