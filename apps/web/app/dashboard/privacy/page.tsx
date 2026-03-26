import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadProductPrivacyPageData } from "@/lib/product/privacy";

export default async function DashboardPrivacyPage() {
  const user = await requireUser("/dashboard/privacy");
  const supabase = await createClient();
  const data = await loadProductPrivacyPageData({
    supabase,
    userId: user.id
  });

  if (!data) {
    return null;
  }

  return (
    <main className="shell">
      <section className="card card-wide">
        <ProductEventTracker event="first_privacy_view" payload={{ surface: "dashboard_privacy" }} />
        <p className="eyebrow">Dashboard Privacy</p>
        <h1 className="title">See what you can control now, without pretending hidden systems already exist.</h1>
        <p className="lead">
          This page only surfaces privacy controls that are already real in the product layer:
          memory visibility and repair, source trace review, and channel management.
        </p>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Memory controls</h2>
            <p>{data.memory.active} active memory item(s)</p>
            <p>
              {data.memory.hidden} hidden · {data.memory.incorrect} incorrect ·{" "}
              {data.memory.traceAvailable} with visible source trace
            </p>
          </article>
          <article className="site-card">
            <h2>Channel boundaries</h2>
            <p>{data.channels.active} active / {data.channels.total} total binding(s)</p>
            <p>
              {data.channels.platforms.length > 0
                ? data.channels.platforms.join(", ")
                : "No IM channels attached yet."}
            </p>
          </article>
          <article className="site-card">
            <h2>Boundary model</h2>
            <p>Available now: visible memory, correction flows, source trace, channel state.</p>
            <p>Not shown yet: fake export, delete, or automation toggles.</p>
          </article>
        </div>

        <section className="privacy-section">
          <div className="privacy-section-header">
            <h2>Current privacy controls</h2>
            <p className="helper-copy">
              These entries are real control surfaces, not placeholders for future systems.
            </p>
          </div>
          <div className="site-card-grid">
            {data.availableNow.map((item) => (
              <article className="site-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <Link className="site-inline-link" href={item.href}>
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-section">
          <div className="privacy-section-header">
            <h2>Boundary notes</h2>
            <p className="helper-copy">
              This is where we set expectations instead of drawing unusable controls.
            </p>
          </div>
          <div className="site-card-grid">
            {data.boundaries.map((item) => (
              <article className="site-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="notice notice-warning">
          For now, if you need heavier data handling than these controls provide, use the current
          memory and channel tools first rather than expecting a broader account-level privacy
          console to already exist.
        </div>
      </section>
    </main>
  );
}
