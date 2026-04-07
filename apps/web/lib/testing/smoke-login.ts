import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import { retrySmokeOperation } from "@/lib/testing/smoke-retry";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";

export async function createSmokeLoginResponse(
  request: NextRequest,
  redirectPath: string
) {
  return retrySmokeOperation(async () => {
    const config = getSmokeConfig();

    if (!config) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Smoke login is not configured. Add the smoke env vars and service role key first."
        },
        { status: 503 }
      );
    }

    const admin = createSupabaseClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    await ensureSmokeUserState(admin, config);

    let response = NextResponse.redirect(new URL(redirectPath, request.url));
    const createSmokeSessionClient = () =>
      createServerClient(config.url, config.anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        }
      });

    let supabase = createSmokeSessionClient();

    let { error } = await supabase.auth.signInWithPassword({
      email: config.email,
      password: config.password
    });

    if (
      error &&
      (error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("email not confirmed"))
    ) {
      await ensureSmokeUserState(admin, config, {
        resetPassword: true
      });

      response = NextResponse.redirect(new URL(redirectPath, request.url));
      supabase = createSmokeSessionClient();
      ({ error } = await supabase.auth.signInWithPassword({
        email: config.email,
        password: config.password
      }));
    }

    if (error?.message === "Email logins are disabled") {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: config.email,
        options: {
          redirectTo: new URL(
            `/auth/confirm?next=${encodeURIComponent(redirectPath)}`,
            request.url
          ).toString()
        }
      });

      const tokenHash = linkData?.properties?.hashed_token;

      if (linkError || !tokenHash) {
        return NextResponse.json(
          {
            ok: false,
            message: linkError?.message ?? "Smoke magic link generation failed."
          },
          { status: 500 }
        );
      }

      return NextResponse.redirect(
        new URL(
          `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=email&next=${encodeURIComponent(
            redirectPath
          )}`,
          request.url
        )
      );
    }

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message
        },
        { status: 500 }
      );
    }

    return response;
  }, { label: "smoke login" });
}
