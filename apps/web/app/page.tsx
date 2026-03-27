import { redirect } from "next/navigation";
import { HomeHeroForm } from "@/components/home-hero-form";
import { HomeHeroPreview } from "@/components/home-hero-preview";
import { SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getOptionalUser } from "@/lib/auth-redirect";
import { blogFeaturedPosts } from "@/lib/blog";
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

const supportRoutes = [
  {
    label: "Pricing",
    href: "/pricing",
    source: "home_support_pricing",
  },
  {
    label: "FAQ",
    href: "/faq",
    source: "home_support_faq",
  },
  {
    label: "Safety",
    href: "/safety",
    source: "home_support_safety",
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
  const blogHighlights = blogFeaturedPosts.slice(0, 4);

  if (hasConsoleReady && !allowLandingPreview) {
    redirect("/app");
  }

  // Default role preview data
  const defaultRolePreview = {
    name: "Luna",
    type: "companion" as const,
    tone: "Gentle & Listening",
    tagline: "A relationship that grows with every conversation.",
  };

  return (
    <SiteShell>
      {/* New Hero Section with Dual-Column Layout */}
      <section className="home-section">
        <div className="home-hero-grid">
          {/* Left: Creation Form */}
          <div className="home-hero-form-section">
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "hsl(235 75% 62% / 0.12)",
                  color: "hsl(235 75% 62%)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  border: "1px solid hsl(235 75% 62% / 0.2)",
                }}
              >
                SparkCore
              </span>
            </div>

            {/* Heading */}
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "hsl(235 30% 75%)",
              }}
            >
              Create a companion<br />that remembers.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "var(--muted)",
                maxWidth: "540px",
              }}
            >
              Choose the role, tone, and bond on web. Keep the same relationship
              moving in IM after setup, then return only when memory, privacy,
              or channel repair needs operator control.
            </p>

            {/* Form Component */}
            <HomeHeroForm user={user ? { id: user.id } : null} />
          </div>

          {/* Right: Preview Panel */}
          <HomeHeroPreview roleData={defaultRolePreview} />
        </div>
      </section>

      {/* Rest of the existing sections */}
      <section className="home-feature-spotlight" id="home-memory">
        <div className="home-section-heading">
          <p className="home-kicker">Memory</p>
          <h2>
            Memory should stay visible enough to inspect, not magical enough to
            hide.
          </h2>
          <p>
            This is one of the core reasons to choose SparkCore: the
            relationship can keep continuity without asking you to trust an
            opaque memory blob.
          </p>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-panel home-feature-panel-dark">
            <h3>
              The relationship can remember you without trapping that memory in
              black box logic.
            </h3>
            <p>
              SparkCore gives the web layer a real job: inspect memory, trace it
              back to source, and repair it when the record drifts.
            </p>
            <ul className="site-bullet-list">
              <li>Visible rows that affect continuity.</li>
              <li>Source trace when you need to verify provenance.</li>
              <li>Repair actions instead of forced resets.</li>
            </ul>
            <TrackedLink
              className="site-inline-link"
              event="landing_cta_click"
              href="/features/memory-center"
              payload={{ source: "home_memory_section_guide" }}
            >
              Explore the memory guide
            </TrackedLink>
          </article>

          <aside className="home-memory-preview">
            {memoryPreviewCards.map((card) => (
              <article className="home-memory-preview-card" key={card.title}>
                <p className="home-discovery-label">{card.label}</p>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </aside>
        </div>
      </section>

      <section className="home-feature-spotlight" id="home-im-chat">
        <div className="home-section-heading">
          <p className="home-kicker">IM Chat</p>
          <h2>The daily relationship loop belongs in IM after setup.</h2>
          <p>
            The website should create and control the relationship. IM should
            carry the day-to-day rhythm. That separation keeps the product
            cleaner and easier to understand.
          </p>
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
            <h3>
              Create on web first. Bind IM second. Let the same bond continue
              there.
            </h3>
            <p>
              SparkCore does not treat the website as the forever chat inbox. It
              treats web as setup plus control, then hands the relationship into
              IM where return behavior feels natural.
            </p>
            <ul className="site-bullet-list">
              <li>Create the role and canonical thread once.</li>
              <li>Bind Telegram after setup, not before.</li>
              <li>Keep supplementary web chat only for careful corrections.</li>
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

      <section className="home-routes-wrap">
        <div className="home-section-heading home-section-heading-compact">
          <p className="home-kicker">Blog and pricing</p>
          <h2>
            Keep public reading and transaction pages separate from the core
            landing flow.
          </h2>
          <p>
            Pricing deserves its own page because it is a high-intent decision
            surface. Compare content now lives under blog so the header can stay
            cleaner.
          </p>
        </div>

        <div className="home-routes home-routes-compact">
          <article className="home-route-panel home-route-panel-dark">
            <p className="home-kicker">Blog</p>
            <h2>Guides and compare articles now live in one hub.</h2>
            <p className="home-route-copy">
              Use blog for compare content, feature explainers, and future
              product stories instead of scattering those routes through the
              header.
            </p>
            <div className="home-route-chip-grid">
              {blogHighlights.map((route) => (
                <TrackedLink
                  key={route.href}
                  className="home-route-chip"
                  event="landing_cta_click"
                  href={route.href}
                  payload={{ source: `home_blog_${route.href}` }}
                >
                  {route.title}
                </TrackedLink>
              ))}
            </div>
          </article>

          <article className="home-route-panel">
            <p className="home-kicker">Pricing</p>
            <h2>
              Pricing should stay a dedicated page, not a crowded landing
              section.
            </h2>
            <p className="home-route-copy">
              People reaching pricing usually have higher commercial intent.
              That page should stay clean, expandable, and independently
              optimizable.
            </p>
            <div className="home-route-chip-grid">
              <TrackedLink
                className="home-route-chip"
                event="landing_cta_click"
                href="/pricing"
                payload={{ source: "home_pricing_route" }}
              >
                Pricing
              </TrackedLink>
              {supportRoutes
                .filter((route) => route.href !== "/pricing")
                .map((route) => (
                  <TrackedLink
                    key={route.href}
                    className="home-route-chip"
                    event="landing_cta_click"
                    href={route.href}
                    payload={{ source: route.source }}
                  >
                    {route.label}
                  </TrackedLink>
                ))}
            </div>
          </article>
        </div>
      </section>

      <section className="home-cta-band">
        <div>
          <p className="home-kicker">Start here</p>
          <h2>
            Create on web first. Move the relationship into IM after that.
          </h2>
          <p>
            The first page should stay simple: create the role, decide the bond,
            preview the portrait slot, and continue into the deeper loop only
            when you are ready.
          </p>
        </div>

        <div className="home-cta-actions">
          <a
            className="button button-primary"
            href="#home-top"
            style={{ minWidth: "200px", justifyContent: "center" }}
          >
            Back to create
          </a>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/blog"
            payload={{ source: "home_final_blog" }}
            style={{ minWidth: "200px", justifyContent: "center" }}
          >
            Read blog
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
