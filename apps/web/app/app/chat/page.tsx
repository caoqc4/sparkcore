import Link from "next/link";
import { ChatConsoleShell } from "@/components/chat-console-shell";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
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
  const channelsHref = `/app/channels${roleQuerySuffix}`;

  if (!data) {
    return null;
  }

  // Empty state — no role or thread yet
  if (!data.thread || !data.role) {
    return (
      <ProductConsoleShell
        actions={
          <Link className="button site-action-link" href="/create">
            Create companion
          </Link>
        }
        currentHref="/app/chat"
        description="Create a companion first, then come back here to continue the relationship."
        eyebrow="Chat"
        shellContext={overview}
        title="No conversation yet."
      >
        <div className="product-empty-state">
          <strong>No companion set up</strong>
          <p>
            Start by creating a role, then your first conversation will appear
            here.
          </p>
        </div>
      </ProductConsoleShell>
    );
  }

  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;

  return (
    <ChatConsoleShell
      currentHref="/app/chat"
      roleHref={roleHref}
      channelsHref={channelsHref}
      threadTitle={data.thread.title}
      followUpCount={followUpCount}
      shellContext={overview}
    >
      <ProductEventTracker
        event="first_supplementary_chat_view"
        payload={{
          surface: "dashboard_chat",
          platform: data.bindings.platforms[0] ?? "web_only",
        }}
      />
      <SupplementaryChatThread
        messages={data.messages}
        threadId={data.thread.threadId}
        roleName={data.role.name}
      />
    </ChatConsoleShell>
  );
}
