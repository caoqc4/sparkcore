import { createServerClient } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

const DEV_SMOKE_SECRET = "sparkcore-smoke-local";
const DEV_SMOKE_EMAIL = "smoke@example.com";
const DEV_SMOKE_PASSWORD = "SparkcoreSmoke123!";

const SMOKE_MODEL_PROFILES = [
  {
    slug: "spark-default",
    name: "Spark Default",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.7,
    max_output_tokens: null,
    metadata: {
      seed: true,
      default: true,
      smoke_seed: true
    }
  },
  {
    slug: "smoke-alt",
    name: "Smoke Alt",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.3,
    max_output_tokens: null,
    metadata: {
      seed: true,
      smoke_seed: true
    }
  }
] as const;

type SmokeConfig = {
  secret: string;
  email: string;
  password: string;
  serviceRoleKey: string;
  url: string;
  anonKey: string;
};

type SmokeUser = {
  id: string;
  email: string;
  workspaceId: string;
};

function getFallbackValue(envKey: "secret" | "email" | "password") {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  switch (envKey) {
    case "secret":
      return DEV_SMOKE_SECRET;
    case "email":
      return DEV_SMOKE_EMAIL;
    case "password":
      return DEV_SMOKE_PASSWORD;
  }
}

export function getSmokeConfig() {
  const { url, anonKey } = getSupabaseEnv();
  const secret =
    process.env.PLAYWRIGHT_SMOKE_SECRET ?? getFallbackValue("secret");
  const email =
    process.env.PLAYWRIGHT_SMOKE_EMAIL ?? getFallbackValue("email");
  const password =
    process.env.PLAYWRIGHT_SMOKE_PASSWORD ?? getFallbackValue("password");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !email || !password || !serviceRoleKey) {
    return null;
  }

  return {
    secret,
    email,
    password,
    serviceRoleKey,
    url,
    anonKey
  } satisfies SmokeConfig;
}

export function isAuthorizedSmokeRequest(
  request: NextRequest,
  config: SmokeConfig | null
) {
  if (!config) {
    return false;
  }

  const headerSecret = request.headers.get("x-smoke-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return headerSecret === config.secret || querySecret === config.secret;
}

function getAdminClient(config: SmokeConfig) {
  return createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function ensureSmokeUser(
  admin: SupabaseClient,
  config: SmokeConfig
): Promise<SmokeUser> {
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
        user_metadata: {
          smoke_seed: true
        }
      });

    if (createUserError) {
      throw new Error(`Failed to create the smoke user: ${createUserError.message}`);
    }

    ensuredUser = createdUserData.user;
  }

  if (!ensuredUser?.id) {
    throw new Error("Failed to create the smoke test user.");
  }

  if (existingUser) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: config.password,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          smoke_seed: true
        }
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

  const { error: workspaceUpsertError } = await admin.from("workspaces").upsert(
    {
      owner_user_id: ensuredUser.id,
      name: workspaceName,
      slug: workspaceSlug,
      kind: "personal"
    },
    {
      onConflict: "slug"
    }
  );

  if (workspaceUpsertError) {
    throw new Error(
      `Failed to upsert the smoke workspace: ${workspaceUpsertError.message}`
    );
  }

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", ensuredUser.id)
    .eq("slug", workspaceSlug)
    .maybeSingle();

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

async function ensureSmokeModelProfiles(admin: SupabaseClient) {
  const { error: upsertError } = await admin
    .from("model_profiles")
    .upsert([...SMOKE_MODEL_PROFILES], {
      onConflict: "slug"
    });

  if (upsertError) {
    throw new Error(
      `Failed to seed smoke model profiles: ${upsertError.message}`
    );
  }

  const { data: profiles, error: profilesError } = await admin
    .from("model_profiles")
    .select("id, slug, name")
    .in(
      "slug",
      SMOKE_MODEL_PROFILES.map((profile) => profile.slug)
    )
    .eq("is_active", true);

  if (profilesError || !profiles) {
    throw new Error(
      profilesError?.message ?? "Failed to load smoke model profiles."
    );
  }

  return profiles;
}

async function resetSmokeWorkspaceState(
  admin: SupabaseClient,
  user: SmokeUser
) {
  const { error: deleteThreadsError } = await admin
    .from("threads")
    .delete()
    .eq("owner_user_id", user.id);

  if (deleteThreadsError) {
    throw new Error(
      `Failed to clear smoke threads: ${deleteThreadsError.message}`
    );
  }

  const { error: deleteMemoryError } = await admin
    .from("memory_items")
    .delete()
    .eq("user_id", user.id);

  if (deleteMemoryError) {
    throw new Error(
      `Failed to clear smoke memory: ${deleteMemoryError.message}`
    );
  }

  const { error: deleteAgentsError } = await admin
    .from("agents")
    .delete()
    .eq("owner_user_id", user.id);

  if (deleteAgentsError) {
    throw new Error(
      `Failed to clear smoke agents: ${deleteAgentsError.message}`
    );
  }
}

async function seedSmokeAgents(
  admin: SupabaseClient,
  user: SmokeUser,
  modelProfiles: Array<{ id: string; slug: string; name: string }>
) {
  const { data: personaPacks, error: personaPacksError } = await admin
    .from("persona_packs")
    .select(
      "id, slug, name, persona_summary, style_prompt, system_prompt, description"
    )
    .in("slug", ["spark-guide", "memory-coach"])
    .eq("is_active", true);

  if (personaPacksError || !personaPacks || personaPacks.length < 2) {
    throw new Error(
      personaPacksError?.message ??
        "Expected seeded persona packs for the smoke workspace."
    );
  }

  const sparkGuidePack = personaPacks.find((pack) => pack.slug === "spark-guide");
  const memoryCoachPack = personaPacks.find(
    (pack) => pack.slug === "memory-coach"
  );
  const defaultProfile = modelProfiles.find((profile) => profile.slug === "spark-default");
  const altProfile = modelProfiles.find((profile) => profile.slug === "smoke-alt");

  if (!sparkGuidePack || !memoryCoachPack || !defaultProfile || !altProfile) {
    throw new Error("Smoke seed dependencies are incomplete.");
  }

  const { error: insertAgentsError } = await admin.from("agents").insert([
    {
      workspace_id: user.workspaceId,
      owner_user_id: user.id,
      source_persona_pack_id: sparkGuidePack.id,
      name: "Smoke Guide",
      persona_summary: sparkGuidePack.persona_summary,
      style_prompt: sparkGuidePack.style_prompt,
      system_prompt: sparkGuidePack.system_prompt,
      default_model_profile_id: defaultProfile.id,
      is_custom: false,
      status: "active",
      metadata: {
        smoke_seed: true,
        source_slug: sparkGuidePack.slug,
        source_description: sparkGuidePack.description,
        is_default_for_workspace: true
      }
    },
    {
      workspace_id: user.workspaceId,
      owner_user_id: user.id,
      source_persona_pack_id: memoryCoachPack.id,
      name: "Smoke Memory Coach",
      persona_summary: memoryCoachPack.persona_summary,
      style_prompt: memoryCoachPack.style_prompt,
      system_prompt: memoryCoachPack.system_prompt,
      default_model_profile_id: altProfile.id,
      is_custom: false,
      status: "active",
      metadata: {
        smoke_seed: true,
        source_slug: memoryCoachPack.slug,
        source_description: memoryCoachPack.description
      }
    }
  ]);

  if (insertAgentsError) {
    throw new Error(`Failed to seed smoke agents: ${insertAgentsError.message}`);
  }
}

export async function resetSmokeState() {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
    );
  }

  const admin = getAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);
  const modelProfiles = await ensureSmokeModelProfiles(admin);

  await resetSmokeWorkspaceState(admin, smokeUser);
  await seedSmokeAgents(admin, smokeUser, modelProfiles);

  return {
    workspaceId: smokeUser.workspaceId,
    smokeEmail: smokeUser.email
  };
}

export async function createSmokeLoginResponse(
  request: NextRequest,
  redirectPath: string
) {
  const config = getSmokeConfig();

  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Smoke login is not configured. Add the smoke env vars and service role key first."
      },
      { status: 503 }
    );
  }

  const admin = getAdminClient(config);
  await ensureSmokeUser(admin, config);

  let response = NextResponse.redirect(new URL(redirectPath, request.url));
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message
      },
      { status: 500 }
    );
  }

  return response;
}
