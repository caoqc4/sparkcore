import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { buildPageMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata = buildPageMetadata({
  title: "Workspace",
  description: "Protected Lagun workspace shell used to bootstrap authenticated product access.",
  path: "/workspace",
  noIndex: true
});

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace, error: workspaceError } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  return (
    <ProductConsoleShell
      actions={
        <>
          <form action={signOut}>
            <FormSubmitButton
              className="button button-secondary site-action-link"
              idleText="Sign out"
              pendingText="Signing out..."
            />
          </form>
          <Link className="button button-primary" href="/chat">
            Open chat workspace
          </Link>
        </>
      }
      currentHref="/workspace"
      description="This protected route confirms session state, workspace bootstrap, and the product shell that all user-scoped chat data hangs off."
      eyebrow="Authenticated"
      title="Workspace shell is ready"
    >
      <div className="product-glance-grid">
        <article className="site-card product-highlight-card">
          <h2>Current session</h2>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <p>
            Users who reach this screen already have a valid Supabase session stored in cookies.
          </p>
        </article>

        <article className="product-stat-card">
          <h2>Chat access</h2>
          <p>Protected chat routes are unlocked from here.</p>
          <p>Use this as the jump point into advanced chat and dashboard flows.</p>
        </article>

        <article className="product-stat-card">
          <h2>Relationship data</h2>
          <p>User-scoped threads, messages, and memory attach to this workspace layer.</p>
        </article>
      </div>

      <div className="product-dual-grid">
        <section className="site-card product-form-card">
          <h2>Workspace bootstrap</h2>
          {workspace ? (
            <ul className="list">
              <li>
                Personal workspace: <strong>{workspace.name}</strong>
              </li>
              <li>Workspace type: {workspace.kind}</li>
              <li>Workspace ID: {workspace.id}</li>
            </ul>
          ) : (
            <div className="notice notice-error">
              {workspaceError
                ? `Workspace lookup failed: ${workspaceError.message}`
                : "No workspace was found yet. Apply the Supabase migration, then sign in again to trigger automatic workspace creation."}
            </div>
          )}
        </section>

        <section className="site-card product-preview-card">
          <h2>What this unlocks next</h2>
          <ul className="list">
            <li>Protected chat routes</li>
            <li>User-scoped thread and message data</li>
            <li>Agent memory attached to a personal workspace</li>
          </ul>
        </section>
      </div>
    </ProductConsoleShell>
  );
}
