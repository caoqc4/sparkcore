import { AlternativeLanding } from "@/components/alternative-landing";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Character.AI Alternative for Long-Memory Companion Relationships",
  description:
    "Compare Lagun with Character.AI when you want stronger memory continuity, IM-native chat, and a clearer relationship control center.",
  path: "/alternatives/character-ai"
});

export default function CharacterAiAlternativePage() {
  return (
    <AlternativeLanding
      rival="Character.AI"
      eyebrow="Alternative"
      title="A better Character.AI alternative for long-memory companion relationships."
      description="If Character.AI feels fun but too reset, too app-contained, or too light on relationship continuity, Lagun is designed to offer a stronger long-memory loop, IM-native interaction, and a real control layer on the web."
      switchReasons={[
        "The character may feel entertaining in the moment, but the relationship can still feel reset across sessions.",
        "Memory and continuity feel weaker when you want the same companion to carry a shared history forward.",
        "The main experience stays inside the app instead of continuing where daily communication already happens.",
        "There is not enough user-visible control over remembered context, relationship state, and repair flows."
      ]}
      comparisonRows={[
        {
          label: "Memory continuity",
          sparkcore: "Long memory is part of the product promise, with visible repair and trace entry points.",
          alternative: "Session quality can be strong, but continuity often feels more fragile."
        },
        {
          label: "IM-native access",
          sparkcore: "The main relationship loop can continue in IM, where return behavior feels more natural.",
          alternative: "The experience is more app-contained."
        },
        {
          label: "Relationship control on web",
          sparkcore: "Dashboard, memory center, privacy controls, and channel management are first-class product surfaces.",
          alternative: "Less emphasis on a separate relationship control center."
        },
        {
          label: "Persistent bond vs session chat",
          sparkcore: "The product is framed around continuity and the same role staying governable over time.",
          alternative: "Often feels closer to character session chat."
        }
      ]}
      migrationFit={[
        {
          title: "Best for people leaving session-style character chat",
          body: "Choose Lagun when you want the same companion to feel less disposable and more stable across time."
        },
        {
          title: "Best for users who want visible memory",
          body: "This fits users who do not want memory to stay opaque and unfixable."
        },
        {
          title: "Best for people who want IM continuity",
          body: "The switch makes more sense when you want the relationship to live in a channel you already return to daily."
        }
      ]}
      closingTitle="Move from entertaining character sessions to a companion loop that can actually carry continuity."
      closingBody="Lagun is not trying to win by cloning Character.AI. It is trying to offer a different product center of gravity: long memory, IM-native continuity, and web control over the relationship state."
    />
  );
}
