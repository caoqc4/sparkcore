import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";

export default function AiBoyfriendPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Relationship"
        title="A grounded AI boyfriend experience with continuity, memory, and room to actually continue."
        description="SparkCore treats AI boyfriend as a relationship configuration inside one companion system, not as a disposable romance skin on top of generic chat."
      >
        <FeatureCardGrid
          items={[
            {
              title: "More consistent presence",
              body: "The role can keep tone, shared context, and relationship state over time instead of resetting every time you open a tab."
            },
            {
              title: "Built for ongoing contact",
              body: "IM stays the main daily surface, which makes the bond easier to maintain without turning every moment into a browser session."
            },
            {
              title: "Visible control when it matters",
              body: "The website gives you a place to review memory, tune the role core, manage channels, and keep privacy legible."
            }
          ]}
        />
        <div className="toolbar">
          <TrackedLink
            className="button"
            event="landing_cta_click"
            href="/create?mode=boyfriend"
            payload={{ source: "ai_boyfriend_create" }}
          >
            Create your AI boyfriend
          </TrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/features/im-chat"
            payload={{ source: "ai_boyfriend_im" }}
          >
            See how IM continuity works
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-companion"
            payload={{ source: "ai_boyfriend_to_companion" }}
          >
            Want the broader companion overview?
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
