import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import {
  anonymousViewerShellState,
  buildViewerShellState
} from "@/lib/viewer-shell";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOptionalUser();

  if (!user) {
    return NextResponse.json(anonymousViewerShellState, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const supabase = await createClient();
  const overview = await loadDashboardOverview({
    supabase,
    userId: user.id
  });

  const state = buildViewerShellState({
    authenticated: true,
    hasRole: Boolean(overview?.currentRole),
    hasThread: Boolean(overview?.currentThread),
    hasBindings: (overview?.channelSummary.active ?? 0) > 0,
    nextStepHref: overview?.nextStep.href ?? null,
    nextStepTitle: overview?.nextStep.title ?? null
  });

  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
