import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

export default function SafetyPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Safety"
        title="Relationship-oriented AI needs clear boundaries, visible controls, and grounded expectations."
        description="SparkCore is not trying to become an unrestricted fantasy sandbox. The product direction emphasizes continuity, controllability, and a more trustworthy control surface."
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
      </PageFrame>
    </SiteShell>
  );
}

