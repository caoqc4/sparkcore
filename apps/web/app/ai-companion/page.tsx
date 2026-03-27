import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "AI Companion With Long Memory and IM Continuity",
  description:
    "Learn how SparkCore turns AI companion into a long-memory, IM-native relationship loop with a web control center for memory and privacy.",
  path: "/ai-companion"
});

export default function AiCompanionPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Companion"
        title="An AI companion that remembers you instead of resetting every session."
        description="SparkCore is designed around relationship continuity. The role stays familiar, long-term memory stays visible, and your main conversation can live in IM instead of a browser tab."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Relationship continuity",
              body: "The experience is built so the same companion can carry context, tone, and shared history forward over time."
            },
            {
              title: "Long-memory by design",
              body: "Memory is not hidden magic. The website gives you a control center to inspect, correct, and manage what matters."
            },
            {
              title: "IM-native experience",
              body: "Daily interaction happens where people already chat. The website supports setup and control instead of trying to replace IM."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "ai_companion_create" }}
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
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "ai_companion_memory" }}
            intent="memory"
            labels={{
              anonymous: "Explore memory center",
              signed_in_empty: "Create a role first",
              signed_in_role_only: "Open memory center",
              signed_in_connected: "Open memory center"
            }}
          >
            Explore memory center
          </AdaptiveTrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-girlfriend"
            payload={{ source: "ai_companion_to_girlfriend" }}
          >
            Looking for a relationship-first angle?
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-boyfriend"
            payload={{ source: "ai_companion_to_boyfriend" }}
          >
            Looking for an AI boyfriend path?
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
