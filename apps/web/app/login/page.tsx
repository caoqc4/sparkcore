import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { buildLocalizedPageMetadata } from "@/lib/site";
import { signInWithGoogle } from "./actions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  return buildLocalizedPageMetadata({
    title: { en: "Sign In", "zh-CN": "登录" },
    description: {
      en: "Protected Lagun sign-in flow for existing users.",
      "zh-CN": "面向已有用户的 Lagun 受保护登录流程。",
    },
    path: "/login",
    noIndex: true
  });
}

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { contentLanguage } = await getSiteLanguageState();
  const isZh = contentLanguage === "zh-CN";
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
        <h1 className="title">{isZh ? "登录" : "Sign in"}</h1>
        <p className="lead">
          {isZh ? "使用你的 Google 账户登录以继续。" : "Sign in with your Google account to continue."}
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
              idleText={isZh ? "使用 Google 继续" : "Continue with Google"}
              pendingText={isZh ? "正在跳转到 Google..." : "Redirecting to Google..."}
            />
          </form>
        </div>
      </section>
    </main>
  );
}
