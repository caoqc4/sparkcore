import type { Metadata } from "next";

export const siteConfig = {
  name: "Lagun",
  tagline: "AI companion that remembers you and stays with you in IM.",
  description:
    "Lagun is an IM-native AI companion with long memory, relationship continuity, and a web control center for memory, privacy, and channel management.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  canonicalHost: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/#home-im-chat", label: "IM Chat" },
    { href: "/#home-faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
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
