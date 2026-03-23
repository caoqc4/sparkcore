import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";

export async function createSmokeLoginResponse(
  request: NextRequest,
  redirectPath: string
) {
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

  const admin = getSmokeAdminClient(config);
  await ensureSmokeUserState(admin, config, {
    resetPassword: true
  });

  let response = NextResponse.redirect(new URL(redirectPath, request.url));
  const supabase = createServerClient(config.url, config.anonKey, {
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

  const { error } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password
  });

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
}
