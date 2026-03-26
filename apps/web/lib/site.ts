export const siteConfig = {
  name: "SparkCore",
  tagline: "AI companion that remembers you and stays with you in IM.",
  description:
    "SparkCore is an IM-native companion product with long memory, relationship continuity, and a website control center.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  canonicalHost: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    {
      label: "AI Companion",
      href: "/ai-companion",
      items: [
        { href: "/ai-companion", label: "AI Companion" },
        { href: "/ai-girlfriend", label: "AI Girlfriend" },
        { href: "/ai-boyfriend", label: "AI Boyfriend" },
        { href: "/ai-roleplay-chat", label: "AI Roleplay Chat" }
      ]
    },
    {
      label: "Features",
      href: "/features/memory-center",
      items: [
        { href: "/features/memory-center", label: "Memory" },
        { href: "/features/im-chat", label: "IM Chat" },
        { href: "/features/privacy-controls", label: "Privacy" },
        { href: "/how-it-works", label: "How it works" }
      ]
    },
    {
      label: "Alternatives",
      href: "/alternatives/character-ai",
      items: [
        { href: "/alternatives/character-ai", label: "Character.AI Alternative" },
        { href: "/alternatives/replika", label: "Replika Alternative" }
      ]
    },
    { href: "/pricing", label: "Pricing" },
    { href: "/faq", label: "FAQ" }
  ],
  footer: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/safety", label: "Safety" },
    { href: "/faq", label: "FAQ" }
  ]
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
