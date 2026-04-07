import type { Metadata } from "next";
import { AlternativeLanding } from "@/components/alternative-landing";
import { getReplikaAlternativeCopy } from "@/lib/i18n/alternative-page-copy";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedPageMetadata({
    title: {
      en: "Replika Alternative With Better Memory Continuity",
      "zh-CN": "拥有更强记忆连续性的 Replika 替代方案",
    },
    description: {
      en: "Compare Lagun with Replika when you want a companion relationship with more visible memory, clearer controls, and IM-native continuity.",
      "zh-CN": "如果你希望一段伴侣关系拥有更可见的记忆、更清晰的控制和 IM 原生连续性，可以把 Lagun 与 Replika 对比。",
    },
    keywords: ["replika alternative", "better than replika", "replika with memory", "ai companion replika"],
    path: "/alternatives/replika"
  });
}

export default async function ReplikaAlternativePage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getReplikaAlternativeCopy(contentLanguage);
  return (
    <AlternativeLanding
      rival="Replika"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      rivalProfile={copy.rivalProfile}
      switchReasons={copy.switchReasons}
      comparisonRows={copy.comparisonRows}
      migrationFit={copy.migrationFit}
      closingTitle={copy.closingTitle}
      closingBody={copy.closingBody}
    />
  );
}
