import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";

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
          <TrackedLink
            className="button"
            event="landing_cta_click"
            href="/create"
            payload={{ source: "ai_companion_create" }}
          >
            Create your companion
          </TrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/features/memory-center"
            payload={{ source: "ai_companion_memory" }}
          >
            Explore memory center
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/ai-girlfriend"
            payload={{ source: "ai_companion_to_girlfriend" }}
          >
            Looking for a relationship-first angle?
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
