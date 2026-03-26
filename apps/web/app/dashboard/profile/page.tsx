import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadProductProfilePageData } from "@/lib/product/profile";
import { updateProductRoleProfile } from "@/app/dashboard/profile/actions";

type DashboardProfilePageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
  }>;
};

export default async function DashboardProfilePage({
  searchParams
}: DashboardProfilePageProps) {
  const params = await searchParams;
  const user = await requireUser("/dashboard/profile");
  const supabase = await createClient();
  const data = await loadProductProfilePageData({
    supabase,
    userId: user.id
  });

  if (!data) {
    return null;
  }

  if (!data.role) {
    return (
      <main className="shell">
        <section className="card card-wide">
          <p className="eyebrow">Dashboard Profile</p>
          <h1 className="title">Create a role before editing the role core.</h1>
          <p className="lead">
            This screen is the Layer A control surface for identity, tone, relationship mode,
            proactivity, and boundaries.
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
        <p className="eyebrow">Dashboard Profile</p>
        <h1 className="title">Edit the role core that shapes long-term continuity.</h1>
        <p className="lead">
          This page now reads and updates the current role directly, while keeping the product
          layer focused on identity and relationship controls instead of generic chat settings.
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
          <article className="site-card">
            <h2>Current role</h2>
            <p>{data.role.name}</p>
            <p>{data.role.personaSummary}</p>
          </article>
          <article className="site-card">
            <h2>Relationship context</h2>
            <p>{data.role.currentThreadTitle ?? "No active thread context yet."}</p>
            <p>Mode: {data.role.config.mode} · Tone: {data.role.config.tone}</p>
          </article>
          <article className="site-card">
            <h2>Proactivity</h2>
            <p>{data.role.config.proactivityLevel}</p>
            <p>Use this to keep the relationship pace intentional rather than accidental.</p>
          </article>
        </div>

        <div className="page-frame-body">
          <section className="site-card">
            <h2>Role core settings</h2>
            <form action={updateProductRoleProfile} className="stack">
              <input name="agent_id" type="hidden" value={data.role.agentId} />

              <div className="field">
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input className="input" defaultValue={data.role.name} id="name" name="name" />
              </div>

              <div className="field">
                <label className="label" htmlFor="mode">
                  Mode
                </label>
                <select
                  className="input"
                  defaultValue={data.role.config.mode}
                  id="mode"
                  name="mode"
                >
                  <option value="companion">Companion</option>
                  <option value="girlfriend">Girlfriend</option>
                  <option value="boyfriend">Boyfriend</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="tone">
                  Tone
                </label>
                <select
                  className="input"
                  defaultValue={data.role.config.tone}
                  id="tone"
                  name="tone"
                >
                  <option value="warm">Warm</option>
                  <option value="playful">Playful</option>
                  <option value="steady">Steady</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="relationship_mode">
                  Relationship mode
                </label>
                <input
                  className="input"
                  defaultValue={data.role.config.relationshipMode}
                  id="relationship_mode"
                  name="relationship_mode"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="proactivity_level">
                  Proactivity
                </label>
                <select
                  className="input"
                  defaultValue={data.role.config.proactivityLevel}
                  id="proactivity_level"
                  name="proactivity_level"
                >
                  <option value="low">Low</option>
                  <option value="balanced">Balanced</option>
                  <option value="active">Active</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="boundaries">
                  Boundaries
                </label>
                <textarea
                  className="input textarea"
                  defaultValue={data.role.config.boundaries}
                  id="boundaries"
                  name="boundaries"
                  rows={5}
                />
              </div>

              <FormSubmitButton idleText="Save role core" pendingText="Saving..." />
            </form>
          </section>

          <section className="site-card">
            <h2>Derived preview</h2>
            <p className="helper-copy">
              This preview shows the current role output that will guide future turns and memory
              continuity.
            </p>
            <div className="stack">
              <div className="field">
                <span className="label">Persona summary</span>
                <p className="helper-copy">{data.role.personaSummary}</p>
              </div>
              <div className="field">
                <span className="label">Style prompt</span>
                <p className="helper-copy">{data.role.stylePrompt}</p>
              </div>
              <div className="field">
                <span className="label">System prompt</span>
                <p className="helper-copy">{data.role.systemPrompt}</p>
              </div>
              <Link className="site-inline-link" href="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
