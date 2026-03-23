import type { SupabaseClient } from "@supabase/supabase-js";
import { findSmokeAuthUser } from "@/lib/testing/smoke-auth-user-list";
import type { SmokeConfigLike } from "@/lib/testing/smoke-auth-user-types";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";

export async function ensureSmokeAuthUser(
  admin: SupabaseClient,
  config: SmokeConfigLike,
  options?: {
    resetPassword?: boolean;
  }
) {
  const existingUser = await findSmokeAuthUser(admin, config);

  let ensuredUser = existingUser;

  if (!ensuredUser) {
    const { data: createdUserData, error: createUserError } =
      await admin.auth.admin.createUser({
        email: config.email,
        password: config.password,
        email_confirm: true,
        user_metadata: buildSmokeSeedMetadata()
      });

    if (createUserError) {
      throw new Error(`Failed to create the smoke user: ${createUserError.message}`);
    }

    ensuredUser = createdUserData.user;
  }

  if (!ensuredUser?.id) {
    throw new Error("Failed to create the smoke test user.");
  }

  if (existingUser && options?.resetPassword) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: config.password,
        email_confirm: true,
        user_metadata: mergeSmokeSeedMetadata(existingUser.user_metadata)
      }
    );

    if (updateError) {
      throw new Error(`Failed to update the smoke user: ${updateError.message}`);
    }
  }

  return ensuredUser;
}
