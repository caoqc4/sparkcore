import type { SupabaseClient } from "@supabase/supabase-js";
import type { SmokeConfigLike } from "@/lib/testing/smoke-auth-user-types";

export async function findSmokeAuthUser(
  admin: SupabaseClient,
  config: SmokeConfigLike
) {
  const { data: listedUsersData, error: listError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });

  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  return listedUsersData.users.find((user) => user.email === config.email) ?? null;
}
