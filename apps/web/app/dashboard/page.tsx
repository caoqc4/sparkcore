import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
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
        <ProductEventTracker
          event="first_dashboard_view"
          payload={{ relationship_state: overview.relationshipState }}
        />
        <ProductEventTracker
          event="relationship_summary_view"
          payload={{ relationship_state: overview.relationshipState }}
        />
        <p className="eyebrow">Dashboard</p>
        <h1 className="title">{overview.relationshipSummary.headline}</h1>
        <p className="lead">
          {overview.relationshipSummary.body}
        </p>
        <div className="site-card relationship-summary-card">
          <p className="eyebrow">Relationship summary</p>
          <h2>{overview.relationshipSummary.label}</h2>
          <p>
            {overview.currentRole
              ? `${overview.currentRole.name} is the active role for this relationship loop.`
              : "No active role is attached yet."}
          </p>
          <p>
            {overview.lastInteractionAt
              ? `Last interaction: ${new Date(overview.lastInteractionAt).toLocaleString()}`
              : "No interaction has been recorded yet."}
          </p>
          <p>
            Thread state: {overview.threadState.lifecycleStatus ?? "unknown"} lifecycle
            {overview.threadState.continuityStatus
              ? ` · ${overview.threadState.continuityStatus} continuity`
              : ""}
            {overview.threadState.focusMode ? ` · focus ${overview.threadState.focusMode}` : ""}
          </p>
        </div>
        <div className="site-card-grid">
          <article className="site-card">
            <h2>Next step</h2>
            <p>{overview.nextStep.title}</p>
            <p>{overview.nextStep.body}</p>
            <Link className="site-inline-link" href={overview.nextStep.href}>
              Continue here
            </Link>
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
            <h2>Recent activity</h2>
            <p>
              {overview.recentActivity.userMessage
                ? `Latest user message: ${overview.recentActivity.userMessage}`
                : "No recent user message yet."}
            </p>
            <p>
              {overview.recentActivity.assistantMessage
                ? `Latest role reply: ${overview.recentActivity.assistantMessage}`
                : "No role reply is recorded yet."}
            </p>
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
          <article className="site-card">
            <h2>Follow-up</h2>
            <p>
              {overview.followUpSummary.pendingCount} pending follow-up action(s)
            </p>
            <p>
              {overview.followUpSummary.nextTriggerAt
                ? `Next trigger: ${new Date(overview.followUpSummary.nextTriggerAt).toLocaleString()}`
                : "No scheduled follow-up yet."}
            </p>
            {overview.currentThread ? (
              <Link className="site-inline-link" href="/dashboard/chat">
                Open supplementary chat
              </Link>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
