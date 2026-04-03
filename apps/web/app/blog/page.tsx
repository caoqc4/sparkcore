import Link from "next/link";
import { PageFrame, SiteShell } from "@/components/site-shell";
import { buildPageMetadata } from "@/lib/site";
import { blogFeaturedPosts } from "@/lib/blog";

export const metadata = buildPageMetadata({
  title: "Blog",
  description:
    "Guides, comparisons, and product notes about long-memory companions, IM-native chat, and visible control over the relationship loop.",
  path: "/blog",
});

export default function BlogPage() {
  const comparePosts = blogFeaturedPosts.filter(
    (post) => post.category === "Compare",
  );
  const guidePosts = blogFeaturedPosts.filter(
    (post) => post.category !== "Compare",
  );

  return (
    <SiteShell>
      <PageFrame
        eyebrow="Blog"
        title="Guides and comparisons for relationship-first AI companion products."
        description="Comparisons with popular apps, feature explainers, and deep dives into what long-memory AI companionship actually means."
      >
        <div className="blog-section">
          <div className="blog-section-heading">
            <p className="home-kicker">Comparisons</p>
            <h2>See how Lagun compares to popular AI companion apps.</h2>
            <p>
              Long-memory continuity and IM-native design make for meaningful differences. These comparisons lay them out clearly.
            </p>
          </div>
          <div className="site-card-grid">
            {comparePosts.map((post) => (
              <article className="site-card" key={post.href}>
                <p className="home-kicker">{post.category}</p>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <Link className="site-inline-link" href={post.href}>
                  Read this comparison
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="blog-section">
          <div className="blog-section-heading">
            <p className="home-kicker">Guides</p>
            <h2>Understand the product before you dive in.</h2>
            <p>
              These guides explain how memory works, how IM continuity fits in, and what makes a relationship-first companion different from a generic chatbot.
            </p>
          </div>
          <div className="site-card-grid">
            {guidePosts.map((post) => (
              <article className="site-card" key={post.href}>
                <p className="home-kicker">{post.category}</p>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <Link className="site-inline-link" href={post.href}>
                  Open this guide
                </Link>
              </article>
            ))}
          </div>
        </div>
      </PageFrame>
    </SiteShell>
  );
}
