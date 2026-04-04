import type { Metadata } from "next";
import { getSiteLanguageState, type AppLanguage } from "@/lib/i18n/site";

export const siteConfig = {
  name: "Lagun",
  tagline: "AI companion that remembers you and stays with you in IM.",
  description:
    "Lagun is an IM-native AI companion with long memory, relationship continuity, and a web control center for memory, privacy, and channel management.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  canonicalHost: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/ai-companion", label: "AI Companion" },
    { href: "/ai-girlfriend", label: "AI Girlfriend" },
    { href: "/ai-roleplay-chat", label: "AI Roleplay Chat" },
    { href: "/alternatives/character-ai", label: "Character.AI Alternative" },
    { href: "/alternatives/replika", label: "Replika Alternative" },
    { href: "/#home-im-chat", label: "IM Chat" },
  ],
  footer: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/features/privacy-controls", label: "Privacy" },
    { href: "/blog", label: "Blog" },
    { href: "/safety", label: "Safety" },
    { href: "/faq", label: "FAQ" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
} as const;

export function getSiteUrl() {
  return siteConfig.appUrl;
}

export function getMetadataBase() {
  return new URL(siteConfig.canonicalHost);
}

export function buildPageTitle(title?: string) {
  if (!title) {
    return siteConfig.name;
  }

  return `${title} | ${siteConfig.name}`;
}

export function buildPageDescription(description?: string) {
  return description ?? siteConfig.description;
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const resolvedTitle = buildPageTitle(title);
  const resolvedDescription = buildPageDescription(description);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: path,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
  };
}

type LocalizedStringMap = {
  en: string;
  "zh-CN": string;
};

type LocalizedPageMetadataOptions = {
  title: LocalizedStringMap;
  description: LocalizedStringMap;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  language?: AppLanguage;
  languageSource?: "content" | "system";
};

export async function buildLocalizedPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  language,
  languageSource = "content",
}: LocalizedPageMetadataOptions): Promise<Metadata> {
  const state = language ? null : await getSiteLanguageState();
  const resolvedLanguage =
    language ??
    (languageSource === "system"
      ? state?.effectiveSystemLanguage
      : state?.contentLanguage) ??
    "en";

  return buildPageMetadata({
    title: title[resolvedLanguage],
    description: description[resolvedLanguage],
    path,
    keywords,
    noIndex,
  });
}
