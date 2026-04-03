import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { buildPageMetadata } from "@/lib/site";
import { signInWithGoogle } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "Sign In",
  description: "Protected Lagun sign-in flow for existing users.",
  path: "/login",
  noIndex: true
});

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/app";

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Lagun</p>
        <h1 className="title">Sign in</h1>
        <p className="lead">
          Sign in with your Google account to continue.
        </p>

        <div className="stack">
          {params.error ? (
            <div className="notice notice-error">{params.error}</div>
          ) : null}

          {params.message ? (
            <div className="notice notice-success">{params.message}</div>
          ) : null}

          <form action={signInWithGoogle} className="stack">
            <input name="next" type="hidden" value={nextPath} />
            <FormSubmitButton
              idleText="Continue with Google"
              pendingText="Redirecting to Google..."
            />
          </form>
        </div>
      </section>
    </main>
  );
}
