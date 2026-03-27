import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Privacy Controls for Long-Memory AI Companion Products",
  description:
    "SparkCore privacy controls focus on visible memory, explicit boundaries, and channel awareness so companion continuity stays inspectable.",
  path: "/features/privacy-controls"
});

export default function PrivacyControlsFeaturePage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Feature"
        title="Privacy controls start with visible memory and explicit boundaries."
        description="SparkCore should not ask people to trust hidden retention rules. The first layer of privacy is making memory, trace, and channel boundaries visible enough to inspect and repair."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Visible, not opaque",
              body: "Users can see what long-term memory exists instead of treating privacy as a vague promise behind the scenes."
            },
            {
              title: "Corrective controls",
              body: "Hide, mark incorrect, and restore actions help repair remembered state without pretending the system is immutable."
            },
            {
              title: "Channel boundary awareness",
              body: "The product shows which IM channels are attached to the relationship so users can understand where continuity is entering from."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "feature_privacy_create" }}
            intent="privacy_action"
            labels={{
              anonymous: "Create your companion",
              signed_in_empty: "Create your first role",
              signed_in_role_only: "Open settings",
              signed_in_connected: "Open settings"
            }}
          >
            Create your companion
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/ai-girlfriend"
            payload={{ source: "feature_privacy_girlfriend" }}
          >
            Explore AI girlfriend
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
