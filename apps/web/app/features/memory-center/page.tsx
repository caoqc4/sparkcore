import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

export default function MemoryCenterFeaturePage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Feature"
        title="Memory center makes long-term relationship state visible and correctable."
        description="SparkCore does not treat memory as an opaque side effect. The product is designed so you can understand what is remembered, why it matters, and how it affects continuity."
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
      </PageFrame>
    </SiteShell>
  );
}

