import type { Metadata } from "next";
import { AlternativeLanding } from "@/components/alternative-landing";
import { getCharacterAiAlternativeCopy } from "@/lib/i18n/alternative-page-copy";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedPageMetadata({
    title: {
      en: "Character.AI Alternative With Long Memory & IM Chat",
      "zh-CN": "带长期记忆与 IM 聊天的 Character.AI 替代方案",
    },
    description: {
      en: "Compare Lagun with Character.AI when you want stronger memory continuity, IM-native chat, and a clearer relationship control center.",
      "zh-CN": "如果你希望更强的记忆连续性、IM 原生聊天和更清晰的关系控制中心，可以把 Lagun 与 Character.AI 对比。",
    },
    path: "/alternatives/character-ai"
  });
}

export default async function CharacterAiAlternativePage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getCharacterAiAlternativeCopy(contentLanguage);
  return (
    <AlternativeLanding
      rival="Character.AI"
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
