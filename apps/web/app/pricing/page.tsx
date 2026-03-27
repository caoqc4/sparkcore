import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "SparkCore Pricing",
  description:
    "SparkCore pricing is organized around relationship continuity, memory visibility, and IM channel access instead of generic chatbot credits alone.",
  path: "/pricing",
});

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
              body: "Plans should speak in terms of relationship access and control, not generic AI usage alone.",
            },
            {
              title: "Memory and channels",
              body: "Long-memory visibility and IM channel support are more relevant than a generic credits-first story.",
            },
            {
              title: "Future-ready structure",
              body: "This page is intentionally a shell for now so pricing can evolve without reshaping the site architecture.",
            },
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "pricing_create" }}
            intent="create_companion"
            labels={{
              anonymous: "Create your companion",
              signed_in_empty: "Create your companion",
              signed_in_role_only: "Continue relationship flow",
              signed_in_connected: "Continue relationship flow",
            }}
          >
            Create your companion
          </AdaptiveTrackedLink>
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/how-it-works"
            payload={{ source: "pricing_how_it_works" }}
          >
            See how it works
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/blog"
            payload={{ source: "pricing_blog" }}
          >
            Read guides and comparisons
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
