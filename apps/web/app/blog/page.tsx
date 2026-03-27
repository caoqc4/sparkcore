import Link from "next/link";
import { PageFrame, SiteShell } from "@/components/site-shell";
import { buildPageMetadata } from "@/lib/site";
import { blogFeaturedPosts } from "@/lib/blog";

export const metadata = buildPageMetadata({
  title: "SparkCore Blog",
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
        title="Guides, comparisons, and product notes for relationship-first companion products."
        description="This hub keeps comparisons and product explainers in one public place, so the main landing page can stay focused while deeper reading still stays easy to reach."
      >
        <section className="product-section">
          <div className="product-section-heading">
            <p className="home-kicker">Featured comparisons</p>
            <h2>
              Compare SparkCore without hiding those pages behind a separate
              top-level nav item.
            </h2>
            <p>
              Comparison content still matters, but it belongs inside a broader
              public reading layer rather than competing with the product
              pillars in the header.
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
        </section>

        <section className="product-section">
          <div className="product-section-heading">
            <p className="home-kicker">Core guides</p>
            <h2>
              Read the product story from the outside before you step into the
              console.
            </h2>
            <p>
              These public guides explain memory, IM chat, pricing, and the core
              loop without forcing the landing page to hold every narrative at
              once.
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
        </section>
      </PageFrame>
    </SiteShell>
  );
}
