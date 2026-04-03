import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "AI Girlfriend With Memory, Continuity, and IM Chat",
  description:
    "Lagun positions AI girlfriend as a relationship-first companion with visible memory, ongoing continuity, and IM-native daily conversation.",
  path: "/ai-girlfriend"
});

export default function AiGirlfriendPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Relationship"
        title="A relationship-first AI girlfriend experience with memory, continuity, and control."
        description="This is not a generic chatbot with a romantic skin. Lagun is designed to support a more persistent bond, visible memory, and an IM-native relationship loop."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Remembers your story",
              body: "Important details, preferences, and shared moments can stay visible through the memory center instead of disappearing into scrollback."
            },
            {
              title: "Stays in touch through IM",
              body: "The main relationship surface can live inside IM, which keeps the experience lightweight and naturally recurrent."
            },
            {
              title: "Gives you control",
              body: "You can review long-term memory, inspect channel state, and later manage privacy and relationship settings from the website."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "ai_girlfriend_create" }}
            intent="create_girlfriend"
            labels={{
              anonymous: "Create your AI girlfriend",
              signed_in_empty: "Create your AI girlfriend",
              signed_in_role_only: "Continue relationship flow",
              signed_in_connected: "Continue relationship flow"
            }}
          >
            Create your AI girlfriend
          </AdaptiveTrackedLink>
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "ai_girlfriend_privacy" }}
            intent="privacy"
            labels={{
              anonymous: "Review privacy controls",
              signed_in_empty: "Create a role first",
              signed_in_role_only: "Open settings",
              signed_in_connected: "Open settings"
            }}
          >
            Review privacy controls
          </AdaptiveTrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-companion"
            payload={{ source: "ai_girlfriend_to_companion" }}
          >
            Want the broader companion overview?
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
