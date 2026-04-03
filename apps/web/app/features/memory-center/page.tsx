import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Memory Center for Long-Term AI Companion Relationships",
  description:
    "See how Lagun memory center makes long-term AI companion memory visible, correctable, and trustworthy enough to support relationship continuity.",
  path: "/features/memory-center"
});

export default function MemoryCenterFeaturePage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Feature"
        title="Memory center makes long-term relationship state visible and correctable."
        description="Lagun does not treat memory as an opaque side effect. The product is designed so you can understand what is remembered, why it matters, and how it affects continuity."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Visible memory",
              body: "Users can inspect what the companion is carrying as long-term memory instead of guessing."
            },
            {
              title: "Corrective controls",
              body: "Hide, mark incorrect, and restore flows help keep memory useful without making the relationship feel brittle."
            },
            {
              title: "Relationship trust",
              body: "Memory visibility is part of the product promise: not just that the companion remembers you, but that you can manage that continuity."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "feature_memory_create" }}
            intent="memory_action"
            labels={{
              anonymous: "Create your companion",
              signed_in_empty: "Create your first role",
              signed_in_role_only: "Open memory center",
              signed_in_connected: "Open memory center"
            }}
          >
            Create your companion
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/ai-companion"
            payload={{ source: "feature_memory_companion" }}
          >
            See the companion overview
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
