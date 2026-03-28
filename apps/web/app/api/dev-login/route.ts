import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// ⚠️  Development-only endpoint — blocked in production
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:480px">
        <h2>Dev Login</h2>
        <form method="GET">
          <input name="email" type="email" placeholder="your@email.com"
            style="width:100%;padding:8px;margin-bottom:12px;border:1px solid #ccc;border-radius:6px;font-size:14px" required />
          <button type="submit"
            style="width:100%;padding:10px;background:#6d28d9;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">
            Sign in (dev only)
          </button>
        </form>
        <p style="color:#888;font-size:12px;margin-top:16px">
          Only works in development mode. Uses service role to bypass email auth.
        </p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase env vars" },
      { status: 500 },
    );
  }

  // Use service role admin to generate a magic link without sending email
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "http://localhost:3000/auth/confirm?next=/app" },
  });

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to generate link" },
      { status: 500 },
    );
  }

  // Redirect directly to the confirm route with the token
  const confirmUrl = new URL("http://localhost:3000/auth/confirm");
  confirmUrl.searchParams.set("token_hash", data.properties.hashed_token);
  confirmUrl.searchParams.set("type", "email");
  confirmUrl.searchParams.set("next", "/app");

  return NextResponse.redirect(confirmUrl);
}
