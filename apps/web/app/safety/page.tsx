import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Safety",
  description:
    "Lagun safety focuses on relationship boundaries, manageable memory, and visible web controls for IM-native companion experiences.",
  path: "/safety"
});

export default function SafetyPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Safety"
        title="Relationship-oriented AI needs clear boundaries, visible controls, and grounded expectations."
        description="Lagun is not trying to become an unrestricted fantasy sandbox. The product direction emphasizes continuity, controllability, and a more trustworthy control surface."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Boundaries matter",
              body: "Role behavior and relationship settings should be shaped with explicit boundaries instead of vague hidden defaults."
            },
            {
              title: "Memory should stay manageable",
              body: "Users need to see what the system is carrying and be able to correct it when necessary."
            },
            {
              title: "IM does not remove control",
              body: "Keeping the main interaction in IM still requires a web control center for channel state, privacy, and repair flows."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "safety_create" }}
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
            href="/features/privacy-controls"
            payload={{ source: "safety_privacy_controls" }}
          >
            Review privacy controls
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/faq"
            payload={{ source: "safety_faq" }}
          >
            Read the FAQ
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
