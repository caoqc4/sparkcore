import Link from "next/link";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadDashboardOverview } from "@/lib/product/dashboard";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const overview = await loadDashboardOverview({
    supabase,
    userId: user.id
  });

  if (!overview) {
    return null;
  }

  return (
    <main className="shell">
      <section className="card card-wide">
        <p className="eyebrow">Dashboard</p>
        <h1 className="title">Relationship control center shell is ready.</h1>
        <p className="lead">
          This page now reads real workspace state and acts as the first real relationship
          control center surface. It still stays intentionally light until `/dashboard/memory`
          and the channel flow are fully wired.
        </p>
        <div className="site-card-grid">
          <article className="site-card">
            <h2>Relationship state</h2>
            <p>{overview.relationshipState}</p>
            <p>
              {overview.lastInteractionAt
                ? `Last interaction: ${overview.lastInteractionAt}`
                : "No interaction yet."}
            </p>
          </article>
          <article className="site-card">
            <h2>Memory</h2>
            <p>
              {overview.memorySummary.active} active / {overview.memorySummary.total} total
              memory item(s)
            </p>
            <p>
              Hidden: {overview.memorySummary.hidden} · Incorrect: {overview.memorySummary.incorrect}
            </p>
            <Link className="site-inline-link" href="/dashboard/memory">
              Open memory page
            </Link>
          </article>
          <article className="site-card">
            <h2>Channels</h2>
            <p>
              {overview.channelSummary.active} active / {overview.channelSummary.total} total
              binding(s)
            </p>
            <p>
              {overview.channelSummary.platforms.length > 0
                ? overview.channelSummary.platforms.join(", ")
                : "No channel connected yet."}
            </p>
            <Link className="site-inline-link" href="/dashboard/channels">
              Open channels page
            </Link>
          </article>
          <article className="site-card">
            <h2>Current role</h2>
            <p>{overview.currentRole?.name ?? "No current role."}</p>
            <p>{overview.currentRole?.personaSummary ?? "Create a role to continue."}</p>
            {overview.currentRole ? (
              <Link className="site-inline-link" href="/dashboard/profile">
                Open role profile
              </Link>
            ) : null}
          </article>
          <article className="site-card">
            <h2>Current thread</h2>
            <p>{overview.currentThread?.title ?? "No thread available."}</p>
            <p>{overview.currentThread?.threadId ?? "Create a role to generate a thread."}</p>
            {overview.currentThread ? (
              <Link
                className="site-inline-link"
                href={`/chat?thread=${encodeURIComponent(overview.currentThread.threadId)}`}
              >
                Open thread in chat workspace
              </Link>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
