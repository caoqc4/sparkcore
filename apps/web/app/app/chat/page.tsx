import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { SupplementaryChatThread } from "@/components/supplementary-chat-thread";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";
import { loadProductSupplementaryChatPageData } from "@/lib/product/supplementary-chat";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not recorded yet";
  }

  return new Date(value).toLocaleString();
}

type DashboardChatPageProps = {
  searchParams: Promise<{
    thread?: string;
    role?: string;
  }>;
};

export default async function AppChatPage({
  searchParams,
}: DashboardChatPageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/chat");
  const supabase = await createClient();
  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const [data, overview, resolution] = await Promise.all([
    loadProductSupplementaryChatPageData({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      roleId,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      roleId,
    }),
    resolveProductAppRoute({
      supabase,
      userId: user.id,
    }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const settingsHref = `/app/settings${roleQuerySuffix}`;
  const settingsChannelsHref = `${settingsHref}${
    roleQuerySuffix ? "&" : "?"
  }tab=channels`;
  const memoryHref = `/app/memory${roleQuerySuffix}`;

  if (!data) {
    return null;
  }

  if (!data.thread || !data.role) {
    return (
      <ProductConsoleShell
        actions={
          <Link className="button site-action-link" href="/create">
            Create a role
          </Link>
        }
        currentHref="/app/chat"
        description="This entry point only works when there is a canonical relationship thread to continue."
        eyebrow="Web Continuation"
        shellContext={overview}
        title="Create a role before opening supplementary chat."
      >
        <div className="product-empty-state">
          <p>
            Supplementary chat is meant to continue the same canonical
            relationship thread from the web after the role already exists.
          </p>
        </div>
      </ProductConsoleShell>
    );
  }

  const messageCount = data.messages.length;
  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;
  const needsChannelAttention = data.bindings.activeCount === 0;
  const latestUserMessage = [...data.messages]
    .reverse()
    .find((message) => message.role === "user")?.content;
  const latestAssistantMessage = [...data.messages]
    .reverse()
    .find((message) => message.role === "assistant")?.content;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link
            className="button button-primary"
            href={`/chat?thread=${encodeURIComponent(data.thread.threadId)}`}
          >
            Open advanced workspace
          </Link>
          <Link className="button button-secondary" href={settingsHref}>
            Open settings
          </Link>
        </>
      }
      currentHref="/app/chat"
      description="This page is a supplementary thread entry, not a replacement for the IM-native main loop."
      eyebrow="Web Continuation"
      shellContext={overview}
      title="Continue the same relationship thread from the web."
    >
      <ProductEventTracker
        event="first_supplementary_chat_view"
        payload={{
          surface: "dashboard_chat",
          platform: data.bindings.platforms[0] ?? "web_only",
        }}
      />

      <div className="product-glance-grid product-action-home-grid">
        <article className="site-card product-highlight-card product-action-card product-action-card-primary">
          <p className="product-inline-kicker">Supplementary lane</p>
          <h2>Continue the same thread without opening a second inbox.</h2>
          <p>
            Use web for corrective continuation, careful follow-up, and
            controlled thread repair while IM stays the main rhythm of the
            relationship.
          </p>
          <div className="product-meta-list">
            <p>Role · {data.role.name}</p>
            <p>Canonical thread · {data.thread.title}</p>
            <p>
              {messageCount} stored message(s) · Updated{" "}
              {formatTimestamp(data.thread.updatedAt)}
            </p>
          </div>
          <div className="toolbar">
            <Link
              className="button button-primary"
              href={`/chat?thread=${encodeURIComponent(data.thread.threadId)}`}
            >
              Open advanced workspace
            </Link>
            <Link className="button button-secondary" href={settingsHref}>
              Open settings
            </Link>
          </div>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${
            followUpCount > 0 ? "warning" : "ready"
          }`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Thread posture</span>
            <span
              className={`product-status-pill ${
                followUpCount > 0
                  ? "product-status-pill-warning"
                  : "product-status-pill-ready"
              }`}
            >
              {followUpCount > 0 ? "Queue active" : "Ready to continue"}
            </span>
          </div>
          <strong>
            {followUpCount > 0
              ? `${followUpCount} follow-up task(s) are waiting`
              : "This thread is stable enough for controlled web continuation"}
          </strong>
          <p>
            Relationship state ·{" "}
            {overview?.relationshipSummary.label ?? "In progress"}. Keep the
            next turn inside the same canonical loop.
          </p>
          <div className="product-status-meta">
            <span>
              Focus mode ·{" "}
              {overview?.threadState.focusMode?.replace(/_/g, " ") ?? "not set"}
            </span>
            <span>
              Language ·{" "}
              {overview?.threadState.currentLanguageHint?.toUpperCase() ??
                "auto"}
            </span>
          </div>
        </article>

        <article
          className={`product-stat-card product-action-card product-status-card product-status-card-${
            needsChannelAttention ? "warning" : "ready"
          }`}
        >
          <div className="product-status-card-head">
            <span className="product-inline-kicker">Delivery lane</span>
            <span
              className={`product-status-pill ${
                needsChannelAttention
                  ? "product-status-pill-warning"
                  : "product-status-pill-ready"
              }`}
            >
              {needsChannelAttention ? "Web-first" : "IM anchored"}
            </span>
          </div>
          <strong>
            {needsChannelAttention
              ? "No live IM path is attached yet"
              : `${data.bindings.activeCount} live IM path(s) are attached`}
          </strong>
          <p>
            {needsChannelAttention
              ? "Supplementary chat is carrying more of the relationship than it should. Finish binding IM next."
              : "Web stays supplementary because the daily rhythm can continue in IM."}
          </p>
          <div className="product-status-meta">
            <span>
              Platforms ·{" "}
              {data.bindings.platforms.length > 0
                ? data.bindings.platforms.join(", ")
                : "none connected"}
            </span>
            <span>Stored messages · {messageCount}</span>
          </div>
        </article>
      </div>

      <div className="product-dual-grid">
        <SupplementaryChatThread
          messages={data.messages}
          threadId={data.thread.threadId}
        />

        <aside className="product-chat-rail">
          <section className="site-card product-preview-card product-chat-rail-card">
            <div className="product-status-card-head">
              <h2>Use this lane when...</h2>
              <span className="product-status-pill product-status-pill-neutral">
                Web support
              </span>
            </div>
            <div className="product-route-list">
              <article className="product-route-item">
                <strong>You need a corrective turn on the same thread.</strong>
                <p>
                  Send a web-side message when you need controlled follow-up,
                  not a new conversation surface.
                </p>
              </article>
              <article className="product-route-item">
                <strong>
                  You want to inspect the latest cues before changing memory.
                </strong>
                <p>
                  Review the last user and role turns here before deciding
                  whether memory needs repair.
                </p>
              </article>
              <article className="product-route-item">
                <strong>You do not need the full agent workspace yet.</strong>
                <p>
                  Leave heavy tooling, raw thread access, and deeper debugging
                  for the advanced workspace.
                </p>
              </article>
            </div>
          </section>

          <section className="site-card product-preview-card product-chat-rail-card">
            <h2>Recent continuity cues</h2>
            <div className="product-chat-preview-stack">
              <article className="product-chat-preview">
                <span className="product-chat-preview-label">
                  Latest user turn
                </span>
                <p>
                  {latestUserMessage ??
                    "No recent user turn has been recorded in this thread."}
                </p>
              </article>
              <article className="product-chat-preview">
                <span className="product-chat-preview-label">
                  Latest role turn
                </span>
                <p>
                  {latestAssistantMessage ??
                    "No recent assistant turn has been recorded in this thread."}
                </p>
              </article>
            </div>
          </section>

          <section className="site-card product-preview-card product-chat-rail-card">
            <div className="product-status-card-head">
              <h2>Quick routes</h2>
              <span className="product-status-pill product-status-pill-neutral">
                Next surface
              </span>
            </div>
            <div className="product-route-list">
              <article className="product-route-item">
                <strong>Review memory quality</strong>
                <p>
                  Check whether a recent turn should be hidden, corrected, or
                  restored.
                </p>
                <Link className="site-inline-link" href={memoryHref}>
                  Open memory center
                </Link>
              </article>
              <article className="product-route-item">
                <strong>Review channel posture</strong>
                <p>Make sure continuity is anchored in the right IM path.</p>
                <Link
                  className="site-inline-link"
                  href={settingsChannelsHref}
                >
                  Open channels tab
                </Link>
              </article>
              <article className="product-route-item">
                <strong>Escalate into the full workspace</strong>
                <p>
                  Open the heavier operator surface only when this lighter lane
                  is not enough.
                </p>
                <Link
                  className="site-inline-link"
                  href={`/chat?thread=${encodeURIComponent(data.thread.threadId)}`}
                >
                  Open advanced workspace
                </Link>
              </article>
            </div>
          </section>
        </aside>
      </div>
    </ProductConsoleShell>
  );
}
