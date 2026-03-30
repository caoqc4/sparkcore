import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const returnTo =
    req.nextUrl.searchParams.get("return_to") ??
    `${req.nextUrl.origin}/app/subscription?feedback=${encodeURIComponent("Simulated checkout complete.")}&feedback_type=success`;

  return NextResponse.redirect(returnTo);
}
