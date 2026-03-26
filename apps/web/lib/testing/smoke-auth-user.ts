import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";

export type SmokeConfigLike = {
  email: string;
  password: string;
};

async function retrySmokeAdminCall<T>(
  run: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
  }
) {
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 600;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function ensureSmokeAuthUser(
  admin: SupabaseClient,
  config: SmokeConfigLike,
  options?: {
    resetPassword?: boolean;
  }
) {
  const { data: listedUsersData, error: listError } = await retrySmokeAdminCall(
    () =>
      admin.auth.admin.listUsers({
        page: 1,
        perPage: 200
      })
  );

  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  const existingUser =
    listedUsersData.users.find((user) => user.email === config.email) ?? null;

  let ensuredUser = existingUser;

  if (!ensuredUser) {
    const { data: createdUserData, error: createUserError } = await retrySmokeAdminCall(
      () =>
        admin.auth.admin.createUser({
          email: config.email,
          password: config.password,
          email_confirm: true,
          user_metadata: buildSmokeSeedMetadata()
        })
    );

    if (createUserError) {
      throw new Error(`Failed to create the smoke user: ${createUserError.message}`);
    }

    ensuredUser = createdUserData.user;
  }

  if (!ensuredUser?.id) {
    throw new Error("Failed to create the smoke test user.");
  }

  if (existingUser && options?.resetPassword) {
    const { error: updateError } = await retrySmokeAdminCall(() =>
      admin.auth.admin.updateUserById(existingUser.id, {
        password: config.password,
        email_confirm: true,
        user_metadata: mergeSmokeSeedMetadata(existingUser.user_metadata)
      })
    );

    if (updateError) {
      throw new Error(`Failed to update the smoke user: ${updateError.message}`);
    }
  }

  return ensuredUser;
}
