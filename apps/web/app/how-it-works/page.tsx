import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "How SparkCore Works",
  description:
    "See the SparkCore loop from role creation to IM connection to memory and privacy control on the web.",
  path: "/how-it-works"
});

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="How it works"
        title="Create your companion, connect IM, and keep one relationship going."
        description="The first-stage experience is intentionally simple. The website sets things up. IM carries the daily relationship. The control center helps you manage long-term state."
      >
        <FeatureCardGrid
          items={[
            {
              title: "1. Create your companion",
              body: "Choose a relationship-first mode, set the initial role core, and generate the character you want to continue with."
            },
            {
              title: "2. Connect your IM",
              body: "Bind the companion to a supported IM entry so the main interaction loop moves into a familiar channel."
            },
            {
              title: "3. Return to the control center",
              body: "Use the website to review memory, relationship state, and channel health without turning it into a generic chat workspace."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "how_it_works_create" }}
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
            payload={{ source: "how_it_works_im_chat" }}
            intent="im_chat"
            labels={{
              anonymous: "See IM chat flow",
              signed_in_empty: "Create a role first",
              signed_in_role_only: "Connect an IM channel",
              signed_in_connected: "Open supplementary chat"
            }}
          >
            See IM chat flow
          </AdaptiveTrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/memory-center"
            payload={{ source: "how_it_works_memory_center" }}
          >
            Explore the memory center
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
