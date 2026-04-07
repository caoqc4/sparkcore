import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resolveExternalOrigin(request: NextRequest) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const host = request.headers.get("host")?.trim();

  const resolvedHost = forwardedHost || host;
  const resolvedHostIsLocal = resolvedHost
    ? resolvedHost.startsWith("localhost") || resolvedHost.startsWith("127.0.0.1")
    : false;

  if (resolvedHost && !resolvedHostIsLocal) {
    const resolvedProto = forwardedProto || "https";
    return `${resolvedProto}://${resolvedHost}`.replace(/\/+$/, "");
  }

  if (resolvedHost && resolvedHostIsLocal) {
    return `http://${resolvedHost}`.replace(/\/+$/, "");
  }

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  return new URL(request.url).origin.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/app";
  const externalOrigin = resolveExternalOrigin(request);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, externalOrigin));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, externalOrigin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Sign-in+failed+or+session+expired.+Please+try+again.", externalOrigin)
  );
}
