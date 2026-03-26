import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

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
      </PageFrame>
    </SiteShell>
  );
}

