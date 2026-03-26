import { FeatureCardGrid, PageFrame, SiteShell } from "@/components/site-shell";

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
              title: "Does it remember past chats?",
              body: "That is the point of the memory center and the long-memory system. Important state can be carried forward and later reviewed."
            },
            {
              title: "Do I need to chat on the website?",
              body: "No. The website is mainly for setup and control. The main relationship loop is designed to live in IM."
            },
            {
              title: "Can I control memory later?",
              body: "Yes. The product plan explicitly treats memory visibility and correction as core website functionality."
            }
          ]}
        />
      </PageFrame>
    </SiteShell>
  );
}

