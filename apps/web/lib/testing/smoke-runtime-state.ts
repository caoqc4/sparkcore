import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from "@supabase/supabase-js";
import { deleteOwnedMemoryItems } from "@/lib/chat/memory-item-persistence";
import {
  deleteOwnedAgents,
  deleteOwnedThreads,
  loadActiveModelProfilesBySlugs
} from "@/lib/chat/runtime-turn-context";
import { seedSmokeAgentState } from "@/lib/testing/smoke-agent-seeding";
import {
  getSmokeModelProfiles,
  upsertSmokeModelProfiles
} from "@/lib/testing/smoke-seed-persistence";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";

export type SmokeConfig = {
  secret: string;
  email: string;
  password: string;
  serviceRoleKey: string;
  url: string;
  anonKey: string;
};

export type SmokeUser = {
  id: string;
  email: string;
  workspaceId: string;
};

export function getSmokeAdminClient(config: SmokeConfig) {
  return createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function ensureSmokeUser(
  admin: SupabaseClient,
  config: SmokeConfig,
  options?: {
    resetPassword?: boolean;
  }
): Promise<SmokeUser> {
  return ensureSmokeUserState(admin, config, options);
}

export async function ensureSmokeModelProfiles(admin: SupabaseClient) {
  const { error: upsertError } = await upsertSmokeModelProfiles(admin);

  if (upsertError) {
    throw new Error(
      `Failed to seed smoke model profiles: ${upsertError.message}`
    );
  }

  const { data: profiles, error: profilesError } = await loadActiveModelProfilesBySlugs({
    supabase: admin,
    slugs: getSmokeModelProfiles().map((profile) => profile.slug)
  });

  if (profilesError || !profiles) {
    throw new Error(
      profilesError?.message ?? "Failed to load smoke model profiles."
    );
  }

  return profiles;
}

export async function resetSmokeWorkspaceState(
  admin: SupabaseClient,
  user: SmokeUser
) {
  const { error: deleteThreadsError } = await deleteOwnedThreads({
    supabase: admin,
    userId: user.id
  });

  if (deleteThreadsError) {
    throw new Error(
      `Failed to clear smoke threads: ${deleteThreadsError.message}`
    );
  }

  const { error: deleteMemoryError } = await deleteOwnedMemoryItems({
    supabase: admin,
    userId: user.id
  });

  if (deleteMemoryError) {
    throw new Error(
      `Failed to clear smoke memory: ${deleteMemoryError.message}`
    );
  }

  const { error: deleteAgentsError } = await deleteOwnedAgents({
    supabase: admin,
    userId: user.id
  });

  if (deleteAgentsError) {
    throw new Error(
      `Failed to clear smoke agents: ${deleteAgentsError.message}`
    );
  }
}

export async function seedSmokeAgents(
  admin: SupabaseClient,
  user: SmokeUser,
  modelProfiles: Array<{ id: string; slug: string; name: string }>
) {
  await seedSmokeAgentState({
    admin,
    user,
    modelProfiles
  });
}
