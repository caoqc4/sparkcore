import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main className="shell">
      <div className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">Authenticated</p>
            <h1 className="title">Workspace shell is ready</h1>
          </div>

          <form action={signOut}>
            <FormSubmitButton
              className="button button-secondary"
              idleText="Sign out"
              pendingText="Signing out..."
            />
          </form>
        </div>

        <section className="hero">
          <h2>Supabase Auth is working</h2>
          <p>
            This is the first protected page for SparkCore. Users who reach this
            screen already have a valid Supabase session stored in cookies, and
            unauthenticated visitors are redirected to the login page.
          </p>
        </section>

        <section className="grid">
          <article className="panel">
            <h3>Current session</h3>
            <p className="lead">
              Signed in as <strong>{user.email}</strong>
            </p>
          </article>

          <article className="panel">
            <h3>Workspace bootstrap</h3>
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
          </article>

          <article className="panel">
            <h3>What this unlocks next</h3>
            <ul className="list">
              <li>Protected chat routes</li>
              <li>User-scoped thread and message data</li>
              <li>Agent memory attached to a personal workspace</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
