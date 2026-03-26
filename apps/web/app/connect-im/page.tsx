import Link from "next/link";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadOwnedActiveAgent, loadOwnedThread, loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";

type ConnectImPageProps = {
  searchParams: Promise<{
    thread?: string;
    agent?: string;
    created?: string;
  }>;
};

export default async function ConnectImPage({ searchParams }: ConnectImPageProps) {
  const params = await searchParams;
  const user = await requireUser("/connect-im");
  const supabase = await createClient();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return null;
  }

  const [bindings, threadResult, agentResult] = await Promise.all([
    loadOwnedChannelBindings({
      supabase,
      workspaceId: workspace.id,
      userId: user.id
    }),
    typeof params.thread === "string"
      ? loadOwnedThread({
          supabase,
          threadId: params.thread,
          userId: user.id,
          workspaceId: workspace.id
        })
      : Promise.resolve({ data: null }),
    typeof params.agent === "string"
      ? loadOwnedActiveAgent({
          supabase,
          agentId: params.agent,
          workspaceId: workspace.id,
          userId: user.id
        })
      : Promise.resolve({ data: null })
  ]);

  return (
    <main className="shell">
      <section className="card card-wide">
        <p className="eyebrow">Connect IM</p>
        <h1 className="title">Attach your relationship thread to a real channel.</h1>
        <p className="lead">
          This page now reads real workspace, agent, thread, and binding state. The
          main missing piece is the end-user binding contract itself.
        </p>

        {params.created === "1" ? (
          <div className="notice notice-success">
            Role and thread created. You can now move into channel setup.
          </div>
        ) : null}

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Current role</h2>
            <p>{agentResult.data?.name ?? "No role selected."}</p>
            <p>{agentResult.data?.persona_summary ?? "Create a role first to continue."}</p>
          </article>

          <article className="site-card">
            <h2>Canonical thread</h2>
            <p>{threadResult.data?.title ?? "No thread selected."}</p>
            <p>{threadResult.data?.id ?? "Create a role to generate a thread."}</p>
          </article>

          <article className="site-card">
            <h2>Active bindings</h2>
            <p>{bindings.filter((item) => item.status === "active").length} active channel(s)</p>
            <p>{bindings.length > 0 ? bindings.map((item) => item.platform).join(", ") : "No channel bound yet."}</p>
          </article>
        </div>

        <div className="site-card-grid">
          <article className="site-card">
            <h2>Recommended next step</h2>
            <p>
              Use Telegram as the first binding target and attach it to the newly created
              thread once the user-facing bind contract is finalized.
            </p>
            <p>
              For now, this route exposes the real state that the future bind wizard will use.
            </p>
          </article>

          <article className="site-card">
            <h2>Where to go next</h2>
            <p>
              You can move on to the dashboard immediately, then come back once the channel
              setup flow is wired end to end.
            </p>
            <Link className="site-inline-link" href="/dashboard">
              Open dashboard
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
