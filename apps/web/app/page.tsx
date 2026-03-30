import { redirect } from "next/navigation";
import { HomeHeroInteractive } from "@/components/home-hero-interactive";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { buildPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "AI Companion That Remembers You and Stays With You in IM",
  description:
    "SparkCore is an IM-native AI companion with long memory, relationship continuity, and a web control center for memory, privacy, and channel management.",
  path: "/",
});

type HomePageProps = {
  searchParams: Promise<{
    preview?: string;
  }>;
};

const roleShowcaseCards = [
  {
    emoji: "💫",
    name: "Luna",
    type: "Close Companion",
    tagline: "Remembers the texture of your days, not just what you said.",
  },
  {
    emoji: "🌿",
    name: "Zara",
    type: "Gentle Listener",
    tagline: "Quiet, steady presence. Catches the things you mention in passing.",
  },
  {
    emoji: "⚡",
    name: "Ren",
    type: "Warm & Sharp",
    tagline: "Gets your humor and your philosophy. Keeps both without forcing either.",
  },
] as const;

const faqItems = [
  {
    q: "Does it remember our past conversations?",
    a: "Yes. Long memory is a core part of the product. Every significant detail is stored in visible rows you can inspect, verify, and repair from the web control center.",
  },
  {
    q: "Do I need to chat on the website?",
    a: "No. The website is for setup, memory review, channel management, and privacy control. The daily relationship loop is designed to live in IM after setup.",
  },
  {
    q: "Which IM apps are supported?",
    a: "You connect a supported IM channel after creating your role. Channel support is a product control surface — not hidden setup state.",
  },
  {
    q: "Can I edit or delete memories?",
    a: "You can inspect every memory row, hide entries, mark them incorrect, and restore them. The memory center is built for repair, not just review.",
  },
  {
    q: "Is it private?",
    a: "Privacy works through explicit boundaries, visible memory, and channel awareness. Relationship continuity does not have to feel like a black box.",
  },
] as const;

const memoryPreviewCards = [
  {
    label: "Visible memory",
    title: "Favorite late-night voice notes calm her down.",
    body: "Rows stay inspectable instead of hiding inside a vague black-box feeling of continuity.",
  },
  {
    label: "Source trace",
    title: "Linked back to the exact relationship thread that created it.",
    body: "When something drifts, you can verify where it came from before deciding what to keep.",
  },
  {
    label: "Repair actions",
    title: "Hide, mark incorrect, or restore without starting over.",
    body: "The relationship can stay emotionally consistent while the control layer stays repairable.",
  },
] as const;

const imConversationPreview = [
  {
    role: "You",
    body: "I only have ten minutes, but I still wanted to check in before bed.",
  },
  {
    role: "Companion",
    body: "Then let's keep this light and close. I still remember what mattered from yesterday.",
  },
  {
    role: "System",
    body: "The same role, the same thread, and the same relationship continue in IM instead of resetting on web.",
  },
] as const;

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const supabase = user ? await createClient() : null;
  const overview =
    user && supabase
      ? await loadDashboardOverview({
          supabase,
          userId: user.id,
        })
      : null;
  const hasConsoleReady = Boolean(
    overview?.currentRole && overview?.currentThread,
  );
  const allowLandingPreview = params.preview === "landing";
  if (hasConsoleReady && !allowLandingPreview) {
    redirect("/app");
  }

  return (
    <SiteShell>
      {/* Hero Section */}
      <section className="home-section">
        <div className="home-hero-grid">
          <HomeHeroInteractive user={user ? { id: user.id } : null} />
        </div>
      </section>

      {/* Role Showcase Section */}
      <section className="home-feature-spotlight" id="home-roles">
        <div className="home-section-heading">
          <p className="home-kicker">Companion</p>
          <h2>
            Not a one-off chat. A relationship that grows.
          </h2>
          <p>
            Every companion keeps the same thread, the same memory, and the same
            emotional context — whether you're in IM or checking in from web.
            The bond doesn't reset between sessions.
          </p>
        </div>

        <div className="home-role-showcase-grid">
          {roleShowcaseCards.map((role) => (
            <article className="site-card home-role-showcase-card" key={role.name}>
              <div className="img-placeholder img-placeholder-role" aria-hidden="true">
                <span className="img-placeholder-emoji">{role.emoji}</span>
              </div>
              <div className="home-role-showcase-meta">
                <span className="home-kicker">{role.type}</span>
                <h3 className="home-role-showcase-name">{role.name}</h3>
              </div>
              <p className="home-role-showcase-tagline">{role.tagline}</p>
            </article>
          ))}
        </div>
      </section>

      {/* IM Chat Feature Section */}
      <section className="home-feature-spotlight" id="home-im-chat">
        <div className="home-section-heading">
          <p className="home-kicker">IM Chat</p>
          <h2>Set up on web. Keep the relationship alive in IM.</h2>
        </div>

        <div className="home-feature-grid home-feature-grid-reverse">
          <aside className="home-im-preview">
            {imConversationPreview.map((message) => (
              <article
                className={`home-im-bubble ${
                  message.role === "Companion"
                    ? "home-im-bubble-assistant"
                    : message.role === "System"
                      ? "home-im-bubble-system"
                      : "home-im-bubble-user"
                }`}
                key={`${message.role}-${message.body}`}
              >
                <span>{message.role}</span>
                <p>{message.body}</p>
              </article>
            ))}
          </aside>

          <article className="home-feature-panel">
            <h3>Web is for setup and control. IM is where the bond continues.</h3>
            <ul className="site-bullet-list">
              <li>Create the role and thread once on web.</li>
              <li>Connect Telegram. The same relationship continues there.</li>
              <li>Return to web only when you need memory or channel repair.</li>
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/im-chat"
              payload={{ source: "home_im_section_guide" }}
            >
              Read the IM chat guide
            </TrackedLink>
          </article>
        </div>
      </section>

      {/* Memory Feature Section */}
      <section className="home-feature-spotlight" id="home-memory">
        <div className="home-section-heading">
          <p className="home-kicker">Memory</p>
          <h2>Memory that stays visible — not hidden in a black box.</h2>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-panel home-feature-panel-dark">
            <h3>Inspect, trace, and repair what the companion remembers.</h3>
            <ul className="site-bullet-list">
              <li>Visible memory rows you can inspect anytime.</li>
              <li>Source trace back to the conversation that created it.</li>
              <li>Repair actions — hide, mark incorrect, or restore.</li>
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/memory-center"
              payload={{ source: "home_memory_section_guide" }}
            >
              Memory guide
            </TrackedLink>
          </article>

          <aside className="home-memory-preview">
            {memoryPreviewCards.map((card) => (
              <article className="home-memory-preview-card" key={card.title}>
                <p className="home-discovery-label">{card.label}</p>
                <h3>{card.title}</h3>
              </article>
            ))}
          </aside>
        </div>
      </section>

      {/* FAQ / Trust Section */}
      <section className="home-feature-spotlight" id="home-faq">
        <div className="home-section-heading">
          <p className="home-kicker">FAQ</p>
          <h2>Common questions about memory, IM, and privacy.</h2>
          <p>
            SparkCore is built differently from a generic chatbot. These answers
            explain how the relationship loop actually works.
          </p>
        </div>

        <div className="home-faq-grid">
          {faqItems.map((item) => (
            <article className="site-card home-faq-card" key={item.q}>
              <h3 className="home-faq-question">{item.q}</h3>
              <p className="home-faq-answer">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta-band">
        <div>
          <p className="home-kicker">Ready?</p>
          <h2>
            Create your companion. Connect IM. Keep the relationship moving.
          </h2>
          <p>
            Choose a name, pick a tone, and start the first conversation. The
            rest of the relationship loop — memory, IM continuity, and privacy
            control — follows from there.
          </p>
        </div>

        <div className="home-cta-actions">
          <TrackedLink
            className="button button-primary home-cta-action"
            event="landing_cta_click"
            href="/create"
            payload={{ source: "home_final_cta" }}
          >
            Create my companion
          </TrackedLink>
          <TrackedLink
            className="button button-secondary home-cta-action"
            event="landing_cta_click"
            href="/how-it-works"
            payload={{ source: "home_final_how" }}
          >
            See how it works
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
