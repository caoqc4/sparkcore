import type { SupabaseClient } from "@supabase/supabase-js";
import { loadOwnedWorkspaceBySlug } from "@/lib/chat/runtime-turn-context";
import { upsertSmokeWorkspace } from "@/lib/testing/smoke-seed-persistence";

export async function ensureSmokeUserWorkspace(args: {
  admin: SupabaseClient;
  userId: string;
  email: string;
}) {
  const workspaceSlug = `personal-${args.userId.replaceAll("-", "")}`;
  const workspaceName = `${args.email.split("@")[0] || "sparkcore"} workspace`;

  const { error: userUpsertError } = await args.admin.from("users").upsert(
    {
      id: args.userId,
      email: args.email
    },
    {
      onConflict: "id"
    }
  );

  if (userUpsertError) {
    throw new Error(`Failed to upsert the smoke profile: ${userUpsertError.message}`);
  }

  const { error: workspaceUpsertError } = await upsertSmokeWorkspace({
    admin: args.admin,
    userId: args.userId,
    workspaceName,
    workspaceSlug
  });

  if (workspaceUpsertError) {
    throw new Error(
      `Failed to upsert the smoke workspace: ${workspaceUpsertError.message}`
    );
  }

  const { data: workspace, error: workspaceError } = await loadOwnedWorkspaceBySlug({
    supabase: args.admin,
    workspaceSlug,
    userId: args.userId
  });

  if (workspaceError || !workspace) {
    throw new Error(
      workspaceError?.message ?? "Failed to resolve the smoke workspace."
    );
  }

  return workspace;
}
