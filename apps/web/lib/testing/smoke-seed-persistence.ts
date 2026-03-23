import type { SupabaseClient } from "@supabase/supabase-js";
import { insertSmokeSeedAgents } from "@/lib/testing/smoke-agent-seed-persistence";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-model-profile-seeds";

type SmokeUser = {
  id: string;
  workspaceId: string;
};

export async function upsertSmokeWorkspace(args: {
  admin: SupabaseClient;
  userId: string;
  workspaceName: string;
  workspaceSlug: string;
}) {
  return args.admin.from("workspaces").upsert(
    {
      owner_user_id: args.userId,
      name: args.workspaceName,
      slug: args.workspaceSlug,
      kind: "personal"
    },
    {
      onConflict: "slug"
    }
  );
}

export async function upsertSmokeModelProfiles(admin: SupabaseClient) {
  return admin.from("model_profiles").upsert([...getSmokeModelProfiles()], {
    onConflict: "slug"
  });
}
