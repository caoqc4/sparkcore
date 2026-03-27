import { AdaptiveTrackedLink } from "@/components/adaptive-tracked-link";
import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";
import { TrackedLink } from "@/components/tracked-link";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "IM Chat for AI Companion Continuity",
  description:
    "Understand why SparkCore keeps the main companion relationship in IM while the website stays focused on setup, memory, and control.",
  path: "/features/im-chat"
});

export default function ImChatFeaturePage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Feature"
        title="IM-native chat keeps the relationship where daily life already happens."
        description="SparkCore treats IM as the main interaction surface. The website acts as a control center for setup, memory, and relationship state rather than forcing every conversation back into the browser."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Natural entry point",
              body: "People already use IM all day. Keeping the companion there lowers friction and supports steady return behavior."
            },
            {
              title: "Shared state, not mirrored clutter",
              body: "The canonical thread and relationship state stay shared, but website messages do not have to become mirrored IM bubbles."
            },
            {
              title: "Website as control center",
              body: "IM stays lightweight while the website handles configuration, channel control, and memory visibility."
            }
          ]}
        />
        <div className="toolbar">
          <AdaptiveTrackedLink
            className="button"
            event="landing_cta_click"
            payload={{ source: "feature_im_create" }}
            intent="im_action"
            labels={{
              anonymous: "Create your companion",
              signed_in_empty: "Create your first role",
              signed_in_role_only: "Connect an IM channel",
              signed_in_connected: "Open supplementary chat"
            }}
          >
            Create your companion
          </AdaptiveTrackedLink>
          <AdaptiveTrackedLink
            className="button button-secondary"
            event="landing_cta_click"
            payload={{ source: "feature_im_connect" }}
            intent="im_action"
            labels={{
              anonymous: "See the connect flow",
              signed_in_empty: "Create a role first",
              signed_in_role_only: "Connect an IM channel",
              signed_in_connected: "Open supplementary chat"
            }}
          >
            See the connect flow
          </AdaptiveTrackedLink>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
