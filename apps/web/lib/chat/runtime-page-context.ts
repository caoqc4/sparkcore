import { createAdminClient } from "@/lib/supabase/admin";
import {
  isTransientSupabaseFetchError,
  retryOnceOnTransientSupabaseFetch
} from "@/lib/supabase/transient-fetch";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";
import { isSmokeModeEnabled } from "@/lib/chat/runtime-core-helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RuntimePageUser = {
  id: string;
  email?: string | null;
};

export async function retryRuntimePageLoadInSmokeMode<T>(args: {
  task: () => Promise<T>;
  label: string;
}) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await args.task();
    } catch (error) {
      lastError = error;

      if (
        !isSmokeModeEnabled() ||
        !isTransientSupabaseFetchError(error) ||
        attempt === 2
      ) {
        break;
      }

      console.warn(
        `[runtime] Retrying ${args.label} after transient smoke fetch failure (${attempt + 1}/3)`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function resolveRuntimePageUserWithSmokeFallback(
  supabase: SupabaseClient
): Promise<{
  supabase: SupabaseClient;
  user: RuntimePageUser | null;
}> {
  try {
    const {
      data: { user }
    } = await retryOnceOnTransientSupabaseFetch({
      task: () => supabase.auth.getUser(),
      delayMs: 300
    });

    if (user) {
      return {
        supabase,
        user: {
          id: user.id,
          email: user.email ?? null
        }
      };
    }
  } catch (error) {
    if (!isTransientSupabaseFetchError(error) || !isSmokeModeEnabled()) {
      throw error;
    }
  }

  if (!isSmokeModeEnabled()) {
    return {
      supabase,
      user: null
    };
  }

  const smokeConfig = getSmokeConfig();

  if (!smokeConfig) {
    return {
      supabase,
      user: null
    };
  }

  const admin = createAdminClient();
  const smokeUser = await ensureSmokeUserState(admin, smokeConfig, {
    resetPassword: false
  });

  return {
    supabase: admin,
    user: {
      id: smokeUser.id,
      email: smokeUser.email
    }
  };
}
