import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

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
      </PageFrame>
    </SiteShell>
  );
}

