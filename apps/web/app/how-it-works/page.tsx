import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

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
      </PageFrame>
    </SiteShell>
  );
}

