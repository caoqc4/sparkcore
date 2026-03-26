import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

export default function PrivacyControlsFeaturePage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Feature"
        title="Privacy controls start with visible memory and explicit boundaries."
        description="SparkCore should not ask people to trust hidden retention rules. The first layer of privacy is making memory, trace, and channel boundaries visible enough to inspect and repair."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Visible, not opaque",
              body: "Users can see what long-term memory exists instead of treating privacy as a vague promise behind the scenes."
            },
            {
              title: "Corrective controls",
              body: "Hide, mark incorrect, and restore actions help repair remembered state without pretending the system is immutable."
            },
            {
              title: "Channel boundary awareness",
              body: "The product shows which IM channels are attached to the relationship so users can understand where continuity is entering from."
            }
          ]}
        />
      </PageFrame>
    </SiteShell>
  );
}
