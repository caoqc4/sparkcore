import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

export default function PricingPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Pricing"
        title="Pricing will be shaped around relationship continuity, memory, and channel access."
        description="Batch 1 locks the pricing page route and information architecture without overcommitting to credits-heavy billing language. The product promise stays focused on companion value."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Companion access",
              body: "Plans should speak in terms of relationship access and control, not generic AI usage alone."
            },
            {
              title: "Memory and channels",
              body: "Long-memory visibility and IM channel support are more relevant than a generic credits-first story."
            },
            {
              title: "Future-ready structure",
              body: "This page is intentionally a shell for now so pricing can evolve without reshaping the site architecture."
            }
          ]}
        />
      </PageFrame>
    </SiteShell>
  );
}

