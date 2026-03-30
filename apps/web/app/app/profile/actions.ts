"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnedActiveAgent,
  loadPrimaryWorkspace,
  updateOwnedAgent
} from "@/lib/chat/runtime-turn-context";
import {
  buildProductAgentMetadata,
  buildProductPersonaSummary,
  buildProductStylePrompt,
  buildProductSystemPrompt,
  safeProductRoleMode,
  safeProductRoleProactivity,
  safeProductRoleTone,
  trimProductText
} from "@/lib/product/role-core";
import {
  loadActiveAudioAssetById,
  loadAccessiblePortraitAssetById,
  loadOwnedRoleMediaProfile,
  upsertOwnedRoleMediaProfile
} from "@/lib/product/role-media";

function resolveRedirectPath(formData: FormData, fallbackPath: string) {
  const redirectTarget = formData.get("redirect_to");

  if (typeof redirectTarget !== "string" || redirectTarget.length === 0) {
    return fallbackPath;
  }

  if (!redirectTarget.startsWith("/") || redirectTarget.includes("://")) {
    return fallbackPath;
  }

  return redirectTarget;
}

function redirectWithMessage(
  redirectPath: string,
  message: string,
  type: "error" | "success"
): never {
  const separator = redirectPath.includes("?") ? "&" : "?";
  redirect(
    `${redirectPath}${separator}feedback=${encodeURIComponent(message)}&feedback_type=${type}`
  );
}

function normalizeRoleName(name: string, fallbackName: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  const candidate = normalized.length > 0 ? normalized : fallbackName;

  if (candidate.length <= 80) {
    return candidate;
  }

  return candidate.slice(0, 80).trimEnd();
}

function normalizeRelationshipMode(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "long-term companion";
  }

  if (normalized.length <= 120) {
    return normalized;
  }

  return normalized.slice(0, 120).trimEnd();
}

function normalizeBoundaries(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "Be supportive, respectful, and avoid manipulative or coercive behavior.";
  }

  if (normalized.length <= 400) {
    return normalized;
  }

  return normalized.slice(0, 400).trimEnd();
}

function normalizeOptionalId(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function updateProductRoleProfile(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/profile");
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirectWithMessage(redirectPath, "The role to update could not be determined.", "error");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirectWithMessage(redirectPath, "No workspace is available for this account.", "error");
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    redirectWithMessage(redirectPath, "The selected role is unavailable.", "error");
  }

  const name = normalizeRoleName(trimProductText(formData.get("name")), agent.name);
  const mode = safeProductRoleMode(trimProductText(formData.get("mode")));
  const tone = safeProductRoleTone(trimProductText(formData.get("tone")));
  const relationshipMode = normalizeRelationshipMode(
    trimProductText(formData.get("relationship_mode"))
  );
  const boundaries = normalizeBoundaries(trimProductText(formData.get("boundaries")));
  const proactivityLevel = safeProductRoleProactivity(
    trimProductText(formData.get("proactivity_level"))
  );
  const portraitAssetId = normalizeOptionalId(formData.get("portrait_asset_id"));
  const audioAssetId = normalizeOptionalId(formData.get("audio_asset_id"));
  const portraitReferenceEnabledByDefault =
    formData.get("portrait_reference_enabled_by_default") === "true";

  const { data: existingRoleMedia } = await loadOwnedRoleMediaProfile({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (portraitAssetId) {
    const { data: portraitAsset } = await loadAccessiblePortraitAssetById({
      supabase,
      portraitAssetId
    });

    if (!portraitAsset) {
      redirectWithMessage(redirectPath, "The selected portrait asset is unavailable.", "error");
    }
  }

  let resolvedAudioProvider: string | null =
    typeof existingRoleMedia?.audio_provider === "string" ? existingRoleMedia.audio_provider : null;

  if (audioAssetId) {
    const { data: audioAsset } = await loadActiveAudioAssetById({
      supabase,
      audioAssetId
    });

    if (!audioAsset) {
      redirectWithMessage(redirectPath, "The selected audio asset is unavailable.", "error");
    }

    resolvedAudioProvider =
      typeof audioAsset.provider === "string" ? audioAsset.provider : resolvedAudioProvider;
  } else {
    resolvedAudioProvider = null;
  }

  const { error } = await updateOwnedAgent({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id,
    patch: {
      name,
      persona_summary: buildProductPersonaSummary({
        mode,
        tone,
        relationshipMode
      }),
      style_prompt: buildProductStylePrompt(tone),
      system_prompt: buildProductSystemPrompt({
        name,
        mode,
        tone,
        relationshipMode,
        boundaries,
        proactivityLevel
      }),
      metadata: buildProductAgentMetadata({
        mode,
        tone,
        relationshipMode,
        boundaries,
        proactivityLevel,
        existingMetadata:
          agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
            ? (agent.metadata as Record<string, unknown>)
            : {}
      }),
      updated_at: new Date().toISOString()
    }
  });

  if (error) {
    redirectWithMessage(redirectPath, error.message, "error");
  }

  const { error: roleMediaError } = await upsertOwnedRoleMediaProfile({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id,
    portraitPresetId:
      typeof existingRoleMedia?.portrait_preset_id === "string"
        ? existingRoleMedia.portrait_preset_id
        : null,
    portraitStyle:
      typeof existingRoleMedia?.portrait_style === "string" ? existingRoleMedia.portrait_style : null,
    portraitGender:
      typeof existingRoleMedia?.portrait_gender === "string"
        ? existingRoleMedia.portrait_gender
        : null,
    portraitSourceType:
      typeof existingRoleMedia?.portrait_source_type === "string"
        ? existingRoleMedia.portrait_source_type
        : null,
    portraitAssetId,
    portraitReferenceEnabledByDefault,
    audioAssetId,
    audioProvider: resolvedAudioProvider
  });

  if (roleMediaError) {
    redirectWithMessage(redirectPath, roleMediaError.message, "error");
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
  revalidatePath("/create");
  revalidatePath("/connect-im");
  revalidatePath("/chat");
  redirectWithMessage(redirectPath, "Role core updated.", "success");
}
