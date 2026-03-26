import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";

export default async function DashboardChannelsPage() {
  const user = await requireUser("/dashboard/channels");
  const supabase = await createClient();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return null;
  }

  const bindings = await loadOwnedChannelBindings({
    supabase,
    workspaceId: workspace.id,
    userId: user.id
  });

  return (
    <main className="shell">
      <section className="card card-wide">
        <p className="eyebrow">Dashboard Channels</p>
        <h1 className="title">Channel state is now connected to real binding rows.</h1>
        <p className="lead">
          This page is reading from `channel_bindings` directly. The remaining work is the
          end-user bind wizard and action layer.
        </p>
        <div className="site-card-grid">
          {bindings.length > 0 ? (
            bindings.map((binding) => (
              <article className="site-card" key={binding.id}>
                <h2>{binding.platform}</h2>
                <p>Status: {binding.status}</p>
                <p>Channel: {binding.channelId}</p>
                <p>Last sync: {binding.updatedAt ?? "Unknown"}</p>
              </article>
            ))
          ) : (
            <article className="site-card">
              <h2>No channel bindings yet</h2>
              <p>
                Once a user-facing IM bind flow is wired, active channels will appear here with
                real sync status and actions.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
