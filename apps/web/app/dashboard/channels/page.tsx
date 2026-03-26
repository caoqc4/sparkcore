import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import { unbindProductChannel } from "@/app/dashboard/channels/actions";

type DashboardChannelsPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
  }>;
};

export default async function DashboardChannelsPage({
  searchParams
}: DashboardChannelsPageProps) {
  const params = await searchParams;
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
        <h1 className="title">Manage the IM entries attached to your relationship thread.</h1>
        <p className="lead">
          This page now reads from `channel_bindings` directly and supports the first real action
          layer for rebind and unbind workflows.
        </p>
        {params.feedback ? (
          <div
            className={`notice ${
              params.feedback_type === "error" ? "notice-error" : "notice-success"
            }`}
          >
            {params.feedback}
          </div>
        ) : null}
        <div className="site-card-grid">
          {bindings.length > 0 ? (
            bindings.map((binding) => (
              <article className="site-card" key={binding.id}>
                <h2>{binding.platform}</h2>
                <p>Status: {binding.status}</p>
                <p>Channel: {binding.channelId}</p>
                <p>Role: {binding.agentName ?? binding.agentId}</p>
                <p>Thread: {binding.threadTitle ?? binding.threadId ?? "Unknown"}</p>
                <p>Last sync: {binding.updatedAt ?? "Unknown"}</p>
                <div className="memory-card-actions">
                  <Link
                    className="site-inline-link"
                    href={
                      binding.threadId
                        ? `/connect-im?thread=${encodeURIComponent(binding.threadId)}&agent=${encodeURIComponent(binding.agentId)}`
                        : `/connect-im?agent=${encodeURIComponent(binding.agentId)}`
                    }
                  >
                    Rebind or update
                  </Link>
                </div>
                {binding.status === "active" ? (
                  <form action={unbindProductChannel} className="memory-card-actions">
                    <input name="binding_id" type="hidden" value={binding.id} />
                    <FormSubmitButton
                      className="button button-secondary memory-hide-button"
                      idleText="Set inactive"
                      pendingText="Updating..."
                    />
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <article className="site-card">
              <h2>No channel bindings yet</h2>
              <p>
                Use the connect flow to attach Telegram first. Active and inactive bindings will
                appear here with real state and actions.
              </p>
              <Link className="site-inline-link" href="/connect-im">
                Open connect flow
              </Link>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
