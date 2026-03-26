import Link from "next/link";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { SupplementaryChatThread } from "@/components/supplementary-chat-thread";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadProductSupplementaryChatPageData } from "@/lib/product/supplementary-chat";

type DashboardChatPageProps = {
  searchParams: Promise<{
    thread?: string;
  }>;
};

export default async function DashboardChatPage({
  searchParams
}: DashboardChatPageProps) {
  const params = await searchParams;
  const user = await requireUser("/dashboard/chat");
  const supabase = await createClient();
  const data = await loadProductSupplementaryChatPageData({
    supabase,
    userId: user.id,
    threadId: typeof params.thread === "string" ? params.thread : null
  });

  if (!data) {
    return null;
  }

  if (!data.thread || !data.role) {
    return (
      <main className="shell">
        <section className="card card-wide">
          <p className="eyebrow">Dashboard Chat</p>
          <h1 className="title">Create a role before opening supplementary chat.</h1>
          <p className="lead">
            This entry point only works when there is a canonical relationship thread to continue.
          </p>
          <Link className="button site-action-link" href="/create">
            Create a role
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="card card-wide">
        <ProductEventTracker
          event="first_supplementary_chat_view"
          payload={{
            surface: "dashboard_chat",
            platform: data.bindings.platforms[0] ?? "web_only"
          }}
        />
        <p className="eyebrow">Dashboard Chat</p>
        <h1 className="title">Continue the same relationship thread from the web.</h1>
        <p className="lead">
          This page is a supplementary thread entry, not a replacement for the IM-native main loop.
        </p>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Current role</h2>
            <p>{data.role.name}</p>
            <p>{data.role.personaSummary}</p>
          </article>
          <article className="site-card">
            <h2>Canonical thread</h2>
            <p>{data.thread.title}</p>
            <p>
              {data.thread.updatedAt
                ? `Updated ${new Date(data.thread.updatedAt).toLocaleString()}`
                : "No thread activity yet."}
            </p>
          </article>
          <article className="site-card">
            <h2>IM continuity</h2>
            <p>{data.bindings.activeCount} active channel(s)</p>
            <p>
              {data.bindings.platforms.length > 0
                ? data.bindings.platforms.join(", ")
                : "No IM channel attached yet."}
            </p>
          </article>
        </div>

        <div className="page-frame-body">
          <SupplementaryChatThread messages={data.messages} threadId={data.thread.threadId} />

          <section className="site-card supplementary-chat-guidance">
            <h2>How to use this page</h2>
            <p>
              Use this view when you need to continue the same relationship thread from the web,
              for example to correct something, continue a thread after a break, or inspect the
              same context outside IM.
            </p>
            <p>
              This page intentionally avoids thread lists, agent switching, and workspace tooling
              so the product layer stays focused on one canonical relationship thread.
            </p>
            <p>
              Messages sent here continue the same relationship context, but this page is not
              trying to behave like a mirrored IM inbox.
            </p>
            <div className="stack">
              <Link className="site-inline-link" href="/dashboard">
                Back to dashboard
              </Link>
              <Link
                className="site-inline-link"
                href={`/chat?thread=${encodeURIComponent(data.thread.threadId)}`}
              >
                Open advanced workspace
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
