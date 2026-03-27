import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { buildPageMetadata } from "@/lib/site";
import { requestMagicLink } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "Sign In",
  description: "Protected SparkCore sign-in flow for existing users.",
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
        <p className="eyebrow">SparkCore Auth</p>
        <h1 className="title">Sign in with a magic link</h1>
        <p className="lead">
          Start with the fastest possible auth flow for the MVP. Enter your email
          and we&apos;ll send you a secure sign-in link.
        </p>

        <div className="stack">
          {params.error ? (
            <div className="notice notice-error">{params.error}</div>
          ) : null}

          {params.message ? (
            <div className="notice notice-success">{params.message}</div>
          ) : null}

          <form action={requestMagicLink} className="stack">
            <input name="next" type="hidden" value={nextPath} />
            <div className="field">
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                autoComplete="email"
                className="input"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
              type="email"
            />
          </div>

          <FormSubmitButton
            idleText="Send magic link"
            pendingText="Sending magic link..."
          />
        </form>
      </div>
    </section>
  </main>
  );
}
