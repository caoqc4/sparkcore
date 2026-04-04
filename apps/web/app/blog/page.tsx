import Link from "next/link";
import { PageFrame, SiteShell } from "@/components/site-shell";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { getBlogCopy } from "@/lib/i18n/marketing-page-copy";
import { buildLocalizedPageMetadata } from "@/lib/site";
import { blogFeaturedPosts } from "@/lib/blog";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: {
      en: "AI Companion Guides: Memory, IM Chat & Relationships",
      "zh-CN": "AI 伴侣指南：记忆、IM 聊天与关系",
    },
    description: {
      en: "Guides, comparisons, and product notes about long-memory companions, IM-native chat, and visible control over the relationship loop.",
      "zh-CN": "围绕长期记忆伴侣、IM 原生聊天和关系循环可见控制的指南、对比与产品说明。",
    },
    path: "/blog",
  });
}

export default async function BlogPage() {
  const { contentLanguage } = await getSiteLanguageState();
  const copy = getBlogCopy(contentLanguage);
  const comparePosts = blogFeaturedPosts.filter(
    (post) => post.category === "Compare",
  );
  const guidePosts = blogFeaturedPosts.filter(
    (post) => post.category !== "Compare",
  );

  return (
    <SiteShell>
      <PageFrame
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="blog-section">
          <div className="blog-section-heading">
            <p className="home-kicker">{copy.comparisons}</p>
            <h2>{copy.comparisonsTitle}</h2>
            <p>{copy.comparisonsBody}</p>
          </div>
          <div className="site-card-grid">
            {comparePosts.map((post) => (
              <article className="site-card" key={post.href}>
                <p className="home-kicker">{post.category}</p>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <Link className="site-inline-link" href={post.href}>
                  {copy.readComparison}
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="blog-section">
          <div className="blog-section-heading">
            <p className="home-kicker">{copy.guides}</p>
            <h2>{copy.guidesTitle}</h2>
            <p>{copy.guidesBody}</p>
          </div>
          <div className="site-card-grid">
            {guidePosts.map((post) => (
              <article className="site-card" key={post.href}>
                <p className="home-kicker">{post.category}</p>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <Link className="site-inline-link" href={post.href}>
                  {copy.openGuide}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
