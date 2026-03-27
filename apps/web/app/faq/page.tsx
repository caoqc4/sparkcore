import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "SparkCore FAQ",
  description:
    "Find answers about SparkCore memory, IM-native chat, privacy controls, supported channels, and how the website control center fits the product.",
  path: "/faq"
});

export default function FaqPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="FAQ"
        title="Common questions about memory, IM, and the website control center."
        description="These answers establish the Batch 1 public-layer structure and reinforce how SparkCore differs from a generic browser chatbot."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Is this an AI girlfriend or an AI companion?",
              body: "SparkCore uses AI companion as the broader product category. AI girlfriend, AI boyfriend, and roleplay entry points are relationship modes inside the same system."
            },
            {
              title: "Does it remember past chats?",
              body: "Yes. Long memory is a core part of the product, and the memory center is designed so remembered state can be reviewed and repaired."
            },
            {
              title: "Do I need to chat on the website?",
              body: "No. The website is mainly for setup, memory review, channel management, and privacy control. The main relationship loop is designed to live in IM."
            },
            {
              title: "Which IM apps are supported?",
              body: "The current product flow is built around connecting supported IM channels after role creation. Channel support is exposed as a product control surface rather than hidden setup state."
            },
            {
              title: "Can I control or delete memories?",
              body: "You can inspect memory, hide entries, mark them incorrect, and use the web control layer to repair relationship state when it drifts."
            },
            {
              title: "Is it private?",
              body: "Privacy is handled through explicit boundaries, visible memory, and channel awareness so relationship continuity does not have to feel like a black box."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "faq_create" }}
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
          <TrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            href="/features/memory-center"
            payload={{ source: "faq_memory_center" }}
          >
            Review memory center
          </TrackedLink>
          <TrackedLink
            className="site-inline-link"
            event="landing_cta_click"
            href="/features/privacy-controls"
            payload={{ source: "faq_privacy_controls" }}
          >
            Review privacy controls
          </TrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
