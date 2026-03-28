import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { SupplementaryChatThread } from "@/components/supplementary-chat-thread";
import { requireUser } from "@/lib/auth-redirect";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";
import { loadProductSupplementaryChatPageData } from "@/lib/product/supplementary-chat";

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
  const roleHref = `/app/role${roleQuerySuffix}`;
  const knowledgeHref = `/app/knowledge${roleQuerySuffix}`;

  if (!data) {
    return null;
  }

  if (!data.thread || !data.role) {
    return (
      <ProductConsoleShell
        actions={
          <Link className="button site-action-link" href="/create">
            Create companion
          </Link>
        }
        currentHref="/app/chat"
        description="Start the first conversation before you use the web workspace."
        eyebrow="Chat"
        shellContext={overview}
        title="Start the relationship."
      >
        <div className="product-empty-state">
          <strong>No conversation yet</strong>
          <p>
            Create a companion first, then come back here to continue the same
            relationship on the web.
          </p>
        </div>
      </ProductConsoleShell>
    );
  }

  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;
  const needsChannelAttention = data.bindings.activeCount === 0;

  return (
    <ProductConsoleShell
      actions={
        <>
          <Link
            className="button button-primary"
            href={`/chat?thread=${encodeURIComponent(data.thread.threadId)}`}
          >
            Open full chat
          </Link>
          <Link className="button button-secondary" href={roleHref}>
            Review role
          </Link>
          <Link className="button button-secondary" href={knowledgeHref}>
            Review knowledge
          </Link>
        </>
      }
      currentHref="/app/chat"
      description={`Continue with ${data.role.name} in ${data.thread.title}.`}
      eyebrow="Chat"
      shellContext={overview}
      title="Continue the conversation"
    >
      <ProductEventTracker
        event="first_supplementary_chat_view"
        payload={{
          surface: "dashboard_chat",
          platform: data.bindings.platforms[0] ?? "web_only",
        }}
      />

      {/* Compact status chips */}
      <div className="chat-status-bar">
        <span
          className={`product-status-pill product-status-pill-${
            followUpCount > 0 ? "warning" : "ready"
          }`}
        >
          {followUpCount > 0
            ? "Needs attention"
            : "Ready"}
        </span>
        <span
          className={`product-status-pill product-status-pill-${
            needsChannelAttention ? "warning" : "ready"
          }`}
        >
          {needsChannelAttention
            ? "Not set up in IM"
            : "Connected in IM"}
        </span>
      </div>

      {/* Full-width chat thread */}
      <SupplementaryChatThread
        messages={data.messages}
        threadId={data.thread.threadId}
      />
    </ProductConsoleShell>
  );
}
