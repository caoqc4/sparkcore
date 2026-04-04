import type { ReactNode } from "react";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { buildLocalizedPageMetadata } from "@/lib/site";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "App Console", "zh-CN": "应用控制台" },
    description: {
      en: "Protected Lagun control surfaces for memory, channels, boundaries, and supplementary chat.",
      "zh-CN": "用于记忆、渠道、边界和补充聊天的 Lagun 受保护控制台界面。",
    },
    path: "/app",
    noIndex: true,
    languageSource: "system",
  });
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { effectiveSystemLanguage } = await getSiteLanguageState();

  return <div lang={effectiveSystemLanguage}>{children}</div>;
}
