import { AlternativeLanding } from "@/components/alternative-landing";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Replika Alternative With More Memory Visibility and IM Continuity",
  description:
    "Compare SparkCore with Replika when you want a companion relationship with more visible memory, clearer controls, and IM-native continuity.",
  path: "/alternatives/replika"
});

export default function ReplikaAlternativePage() {
  return (
    <AlternativeLanding
      rival="Replika"
      eyebrow="Alternative"
      title="An alternative to Replika for companion relationships with more memory visibility and IM continuity."
      description="If you like the idea of a persistent AI relationship but want stronger long-memory visibility, a clearer control center, and the option to continue in IM instead of one app container, SparkCore is the more product-control-oriented alternative."
      switchReasons={[
        "The bond may exist, but users can still want more transparent memory and more explicit repair loops.",
        "The relationship may feel too contained inside one product surface instead of continuing through IM.",
        "Users may want stronger control over the role setup, channel state, and privacy boundaries.",
        "People looking for alternatives usually want less black-box continuity and more visible control."
      ]}
      comparisonRows={[
        {
          label: "Memory visibility",
          sparkcore: "Users can inspect, hide, mark incorrect, and trace remembered rows.",
          alternative: "Continuity exists, but memory is less centered as a visible repair surface."
        },
        {
          label: "IM-native relationship",
          sparkcore: "The main loop can continue in IM while the website stays a control center.",
          alternative: "The relationship is more tightly held inside the native app surface."
        },
        {
          label: "Role and relationship control",
          sparkcore: "Role core, channels, privacy surfaces, and continuity views are part of the product layer.",
          alternative: "The relationship is more product-contained and less explicitly dashboard-driven."
        },
        {
          label: "Web control center",
          sparkcore: "The web product is built to govern memory, privacy, channels, and supplementary continuity.",
          alternative: "Less emphasis on a separate relationship dashboard as the control plane."
        }
      ]}
      migrationFit={[
        {
          title: "Best for users who want more visible control",
          body: "Switch when the relationship matters, but you also want to see and repair what the system is carrying."
        },
        {
          title: "Best for users who prefer IM-native continuity",
          body: "SparkCore fits better when the daily loop should happen in IM rather than only inside one dedicated app."
        },
        {
          title: "Best for users who want a more governable role",
          body: "This path makes sense when role settings, privacy surfaces, and channel management matter more than a sealed app experience."
        }
      ]}
      closingTitle="Move to a companion product where continuity is not just felt, but also visible and governable."
      closingBody="SparkCore is a better fit when you want the relationship layer to stay emotionally persistent while the underlying memory, channel, and privacy controls stay inspectable."
      ctaVariant="girlfriend"
    />
  );
}
