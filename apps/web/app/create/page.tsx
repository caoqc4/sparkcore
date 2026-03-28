import { RoleCreateWizard } from "@/components/role-create-wizard";
import { SiteShell } from "@/components/site-shell";
import { getOptionalUser } from "@/lib/auth-redirect";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Create Your Companion",
  description:
    "Create a SparkCore companion with a name, personality, and portrait. Set up IM channels after.",
  path: "/create",
  noIndex: true,
});

export default async function CreatePage() {
  const user = await getOptionalUser();

  return (
    <SiteShell>
      <section className="page-frame onboarding-frame">
        <div className="page-frame-header onboarding-frame-header">
          <div className="onboarding-copy">
            <p className="eyebrow">Create Companion</p>
            <h1 className="title">
              Build the relationship before you think about channels.
            </h1>
            <p className="lead">
              Three quick steps — identity, personality, and portrait. IM
              connection comes after, not first.
            </p>
          </div>
        </div>

        <div className="page-frame-body">
          <RoleCreateWizard
            redirectAfterCreate="/app/chat"
            loginNext="/create"
            user={user ? { id: user.id } : null}
          />
        </div>
      </section>
    </SiteShell>
  );
}
