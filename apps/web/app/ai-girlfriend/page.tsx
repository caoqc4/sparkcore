import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

export default function AiGirlfriendPage() {
  return (
    <SiteShell>
      <PageFrame
        eyebrow="Relationship"
        title="A relationship-first AI girlfriend experience with memory, continuity, and control."
        description="This is not positioned as a generic chatbot with a romantic skin. SparkCore is designed to support a more persistent bond, visible memory, and an IM-native relationship loop."
      >
        <FeatureCardGrid
          items={[
            {
              title: "Remembers your story",
              body: "Important details, preferences, and shared moments can stay visible through the memory center instead of disappearing into scrollback."
            },
            {
              title: "Stays in touch through IM",
              body: "The main relationship surface can live inside IM, which keeps the experience lightweight and naturally recurrent."
            },
            {
              title: "Gives you control",
              body: "You can review long-term memory, inspect channel state, and later manage privacy and relationship settings from the website."
            }
          ]}
        />
      </PageFrame>
    </SiteShell>
  );
}

