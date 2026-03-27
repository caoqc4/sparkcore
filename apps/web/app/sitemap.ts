import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const routes = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/ai-companion", changeFrequency: "weekly", priority: 0.95 },
    { path: "/ai-girlfriend", changeFrequency: "weekly", priority: 0.95 },
    { path: "/ai-boyfriend", changeFrequency: "monthly", priority: 0.8 },
    { path: "/ai-roleplay-chat", changeFrequency: "weekly", priority: 0.9 },
    {
      path: "/alternatives/character-ai",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { path: "/alternatives/replika", changeFrequency: "weekly", priority: 0.9 },
    {
      path: "/features/memory-center",
      changeFrequency: "weekly",
      priority: 0.85,
    },
    { path: "/features/im-chat", changeFrequency: "weekly", priority: 0.85 },
    {
      path: "/features/privacy-controls",
      changeFrequency: "monthly",
      priority: 0.75,
    },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.75 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/safety", changeFrequency: "monthly", priority: 0.65 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.65 },
  ] as const;

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
