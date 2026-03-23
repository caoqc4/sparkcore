import type { SupabaseClient } from "@supabase/supabase-js";
import { loadOwnedWorkspaceBySlug } from "@/lib/chat/runtime-turn-context";
import { upsertSmokeWorkspace } from "@/lib/testing/smoke-seed-persistence";
import {
  buildSmokeSeedMetadata,
  mergeSmokeSeedMetadata
} from "@/lib/testing/smoke-seed-metadata";

type SmokeConfigLike = {
  email: string;
  password: string;
};

export async function ensureSmokeUserState(
  admin: SupabaseClient,
  config: SmokeConfigLike,
  options?: {
    resetPassword?: boolean;
  }
) {
  const { data: listedUsersData, error: listError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });

  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  const existingUser =
    listedUsersData.users.find((user) => user.email === config.email) ?? null;

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

  const workspaceSlug = `personal-${ensuredUser.id.replaceAll("-", "")}`;
  const workspaceName = `${
    config.email.split("@")[0] || "sparkcore"
  } workspace`;

  const { error: userUpsertError } = await admin.from("users").upsert(
    {
      id: ensuredUser.id,
      email: config.email
    },
    {
      onConflict: "id"
    }
  );

  if (userUpsertError) {
    throw new Error(`Failed to upsert the smoke profile: ${userUpsertError.message}`);
  }

  const { error: workspaceUpsertError } = await upsertSmokeWorkspace({
    admin,
    userId: ensuredUser.id,
    workspaceName,
    workspaceSlug
  });

  if (workspaceUpsertError) {
    throw new Error(
      `Failed to upsert the smoke workspace: ${workspaceUpsertError.message}`
    );
  }

  const { data: workspace, error: workspaceError } = await loadOwnedWorkspaceBySlug({
    supabase: admin,
    workspaceSlug,
    userId: ensuredUser.id
  });

  if (workspaceError || !workspace) {
    throw new Error(
      workspaceError?.message ?? "Failed to resolve the smoke workspace."
    );
  }

  return {
    id: ensuredUser.id,
    email: config.email,
    workspaceId: workspace.id
  };
}
