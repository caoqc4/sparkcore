import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createProductRole } from "@/app/create/actions";

type ProductRoleSetupProps = {
  user: { id: string } | null;
  surface: string;
  loginNext: string;
  reviewHref?: string;
  shellClassName?: string;
};

export function ProductRoleSetup({
  user,
  surface,
  loginNext,
  reviewHref = "/how-it-works",
  shellClassName
}: ProductRoleSetupProps) {
  return (
    <div className={shellClassName ?? "product-role-shell"}>
      <section className="product-role-card">
        <div className="product-role-card-header">
          <p className="product-role-card-kicker">Setup</p>
          <h2>Shape the first version of your companion.</h2>
        </div>

        <form action={createProductRole} className="stack">
          <div className="field">
            <label className="label" htmlFor={`${surface}-mode`}>
              Mode
            </label>
            <select
              className="input"
              defaultValue="companion"
              id={`${surface}-mode`}
              name="mode"
            >
              <option value="companion">Companion</option>
              <option value="girlfriend">Girlfriend</option>
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor={`${surface}-name`}>
              Name
            </label>
            <input
              className="input"
              id={`${surface}-name`}
              name="name"
              placeholder="Luna"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor={`${surface}-tone`}>
              Tone
            </label>
            <select
              className="input"
              defaultValue="warm"
              id={`${surface}-tone`}
              name="tone"
            >
              <option value="warm">Warm</option>
              <option value="playful">Playful</option>
              <option value="steady">Steady</option>
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor={`${surface}-relationship-mode`}>
              Relationship mode
            </label>
            <input
              className="input"
              defaultValue="long-term companion"
              id={`${surface}-relationship-mode`}
              name="relationship_mode"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor={`${surface}-boundaries`}>
              Boundaries
            </label>
            <textarea
              className="input input-textarea"
              defaultValue="Be supportive, respectful, and avoid manipulative or coercive behavior."
              id={`${surface}-boundaries`}
              name="boundaries"
              rows={4}
            />
          </div>

          {user ? (
            <FormSubmitButton
              className="button button-primary button-large"
              eventName="create_started"
              eventPayload={{ surface }}
              idleText="Create and continue"
              pendingText="Creating..."
            />
          ) : (
            <Link className="button button-primary button-large site-action-link" href={`/login?next=${encodeURIComponent(loginNext)}`}>
              Sign in to create
            </Link>
          )}
        </form>
      </section>

      <aside className="product-role-card product-role-card-side">
        <div className="site-inline-pill">Role core</div>
        <h2>What this creates</h2>
        <p>
          A real role, a canonical relationship thread, and the base setup needed
          to move directly into IM continuation.
        </p>
        <ul className="site-bullet-list">
          <li>One real agent row</li>
          <li>One real canonical thread</li>
          <li>Immediate handoff into IM setup</li>
        </ul>
        <div className="product-role-facts">
          <div>
            <span className="product-role-facts-label">Best for</span>
            <strong>Fast onboarding into a persistent relationship loop</strong>
          </div>
          <div>
            <span className="product-role-facts-label">After submit</span>
            <strong>Continue to IM setup, then return to the control center</strong>
          </div>
        </div>
        <Link className="site-inline-link" href={reviewHref}>
          Review the flow
        </Link>
      </aside>
    </div>
  );
}
