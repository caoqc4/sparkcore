import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "AI Boyfriend With Memory and IM-Native Continuity",
  description:
    "SparkCore frames AI boyfriend as an ongoing relationship experience with long memory, IM-native contact, and visible web controls.",
  path: "/ai-boyfriend"
});

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
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "ai_boyfriend_create" }}
            intent="create_boyfriend"
            labels={{
              anonymous: "Create your AI boyfriend",
              signed_in_empty: "Create your AI boyfriend",
              signed_in_role_only: "Continue relationship flow",
              signed_in_connected: "Continue relationship flow"
            }}
          >
            Create your AI boyfriend
          </AdaptiveTrackedLink>
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "ai_boyfriend_im" }}
            intent="im_chat"
            labels={{
              anonymous: "See how IM continuity works",
              signed_in_empty: "Create a role first",
              signed_in_role_only: "Connect an IM channel",
              signed_in_connected: "Open supplementary chat"
            }}
          >
            See how IM continuity works
          </AdaptiveTrackedLink>
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
