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
  const settingsHref = `/app/settings${roleQuerySuffix}`;

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
        description="Create a role and start the first conversation before opening supplementary chat."
        eyebrow="Web Chat"
        shellContext={overview}
        title="No relationship thread yet."
      >
        <div className="product-empty-state">
          <p>
            Web chat continues the same canonical thread your companion already
            knows. Create a role first to get started.
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
            Advanced workspace
          </Link>
          <Link className="button button-secondary" href={settingsHref}>
            Settings
          </Link>
        </>
      }
      currentHref="/app/chat"
      description={`Continuing with ${data.role.name} · ${data.thread.title}`}
      eyebrow="Web Chat"
      shellContext={overview}
      title="Continue the conversation."
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
            ? `${followUpCount} follow-up pending`
            : "Thread stable"}
        </span>
        <span
          className={`product-status-pill product-status-pill-${
            needsChannelAttention ? "warning" : "ready"
          }`}
        >
          {needsChannelAttention
            ? "Web-only · connect IM"
            : `IM live · ${data.bindings.platforms.join(", ")}`}
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
