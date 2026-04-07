"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";
import {
  loadActivePersonaPackById,
  loadOwnedActiveAgent,
  loadOwnedUserAppSettingsMetadata,
  loadPrimaryWorkspace,
  updateOwnedAgent
} from "@/lib/chat/runtime-turn-context";
import { getProductCharacterPresetDefaults } from "@/lib/characters/preset-defaults";
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
  loadActiveAudioVoiceOptionsByModelSlug,
  loadActiveAudioAssetById,
  loadAccessiblePortraitAssetById,
  loadOwnedRoleMediaProfile,
  pickDefaultAudioVoiceOptionForCharacter,
  loadSharedPresetPortraitAssetByCharacterSlug,
  pickRecommendedAudioVoiceOption,
  resolveDefaultAudioModelSlug,
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

async function getRoleActionCopy() {
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  return {
    isZh,
    missingRole: isZh ? "无法确定要更新的角色。" : "The role to update could not be determined.",
    noWorkspace: isZh ? "当前账户没有可用工作区。" : "No workspace is available for this account.",
    roleUnavailable: isZh ? "所选角色不可用。" : "The selected role is unavailable.",
    portraitUnavailable: isZh ? "所选头像资源不可用。" : "The selected portrait asset is unavailable.",
    audioUnavailable: isZh ? "所选语音资源不可用。" : "The selected audio asset is unavailable.",
    roleUpdated: isZh ? "角色核心资料已更新。" : "Role core updated.",
    missingRestoreRole: isZh ? "无法确定要恢复的角色。" : "The role to restore could not be determined.",
    notPresetRole: isZh ? "这个角色不是从预设创建的。" : "This role was not created from a preset.",
    presetUnavailable: isZh ? "这个角色对应的预设默认值不可用。" : "The preset defaults for this role are unavailable.",
    restored: isZh ? "预设默认值已恢复。" : "Preset defaults restored.",
  };
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

function normalizeBoundaries(value: string, isZh = false) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return isZh
      ? "保持支持与尊重，避免操控或强迫行为。"
      : "Be supportive, respectful, and avoid manipulative or coercive behavior.";
  }

  if (normalized.length <= 400) {
    return normalized;
  }

  return normalized.slice(0, 400).trimEnd();
}

function normalizeBackgroundSummary(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 280) {
    return normalized;
  }

  return normalized.slice(0, 280).trimEnd();
}

function normalizeOptionalId(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function updateProductRoleProfile(formData: FormData) {
  const copy = await getRoleActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/profile");
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirectWithMessage(redirectPath, copy.missingRole, "error");
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
    redirectWithMessage(redirectPath, copy.noWorkspace, "error");
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    redirectWithMessage(redirectPath, copy.roleUnavailable, "error");
  }

  const name = normalizeRoleName(trimProductText(formData.get("name")), agent.name);
  const mode = safeProductRoleMode(trimProductText(formData.get("mode")));
  const tone = safeProductRoleTone(trimProductText(formData.get("tone")));
  const relationshipMode = normalizeRelationshipMode(
    trimProductText(formData.get("relationship_mode"))
  );
  const boundaries = normalizeBoundaries(trimProductText(formData.get("boundaries")), copy.isZh);
  const backgroundSummary = normalizeBackgroundSummary(
    trimProductText(formData.get("background_summary"))
  );
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
      redirectWithMessage(redirectPath, copy.portraitUnavailable, "error");
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
      redirectWithMessage(redirectPath, copy.audioUnavailable, "error");
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
        backgroundSummary,
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
    portraitLockedAt:
      typeof existingRoleMedia?.portrait_locked_at === "string"
        ? existingRoleMedia.portrait_locked_at
        : null,
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
  redirectWithMessage(redirectPath, copy.roleUpdated, "success");
}

export async function restoreProductRoleDefaults(formData: FormData) {
  const copy = await getRoleActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/role");
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirectWithMessage(redirectPath, copy.missingRestoreRole, "error");
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
    redirectWithMessage(redirectPath, copy.noWorkspace, "error");
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    redirectWithMessage(redirectPath, copy.roleUnavailable, "error");
  }

  if (
    typeof agent.source_persona_pack_id !== "string" ||
    agent.source_persona_pack_id.trim().length === 0
  ) {
    redirectWithMessage(redirectPath, copy.notPresetRole, "error");
  }

  const [{ data: sourcePack }, { data: existingRoleMedia }, { data: appSettings }] =
    await Promise.all([
      loadActivePersonaPackById({
        supabase,
        personaPackId: agent.source_persona_pack_id
      }),
      loadOwnedRoleMediaProfile({
        supabase,
        agentId: agent.id,
        workspaceId: workspace.id,
        userId: user.id
      }),
      loadOwnedUserAppSettingsMetadata({
        supabase,
        userId: user.id
      })
    ]);

  const sourceCharacterSlug =
    sourcePack?.metadata &&
    typeof sourcePack.metadata === "object" &&
    !Array.isArray(sourcePack.metadata) &&
    typeof (sourcePack.metadata as Record<string, unknown>).character_slug === "string"
      ? ((sourcePack.metadata as Record<string, unknown>).character_slug as string)
      : null;
  const presetDefaults = getProductCharacterPresetDefaults(
    sourceCharacterSlug,
    copy.isZh ? "zh-CN" : "en"
  );

  if (!presetDefaults) {
    redirectWithMessage(redirectPath, copy.presetUnavailable, "error");
  }

  const appSettingsMetadata =
    appSettings?.metadata &&
    typeof appSettings.metadata === "object" &&
    !Array.isArray(appSettings.metadata)
      ? (appSettings.metadata as Record<string, unknown>)
      : {};
  const preferredAudioModelSlug = resolveDefaultAudioModelSlug(appSettingsMetadata);

  const [{ data: defaultPortraitAsset }, { data: defaultVoiceOptions }] = await Promise.all([
    loadSharedPresetPortraitAssetByCharacterSlug({
      supabase,
      characterSlug: presetDefaults.slug
    }),
    preferredAudioModelSlug
      ? loadActiveAudioVoiceOptionsByModelSlug({
          supabase,
          modelSlug: preferredAudioModelSlug
        })
      : Promise.resolve({ data: [] })
  ]);

  const defaultVoice = pickRecommendedAudioVoiceOption({
    options: Array.isArray(defaultVoiceOptions) ? defaultVoiceOptions : [],
    avatarGender: presetDefaults.avatarGender,
    tone: presetDefaults.tone
  });
  const presetDefaultVoice = pickDefaultAudioVoiceOptionForCharacter({
    options: Array.isArray(defaultVoiceOptions) ? defaultVoiceOptions : [],
    characterSlug: presetDefaults.slug
  });

  const { error } = await updateOwnedAgent({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id,
    patch: {
      name: presetDefaults.name,
      persona_summary: buildProductPersonaSummary({
        mode: presetDefaults.mode,
        avatarGender: presetDefaults.avatarGender,
        tone: presetDefaults.tone,
        relationshipMode: presetDefaults.relationshipMode
      }),
      style_prompt: buildProductStylePrompt(presetDefaults.tone),
      system_prompt: buildProductSystemPrompt({
        name: presetDefaults.name,
        mode: presetDefaults.mode,
        avatarGender: presetDefaults.avatarGender,
        tone: presetDefaults.tone,
        relationshipMode: presetDefaults.relationshipMode,
        boundaries: presetDefaults.boundaries,
        proactivityLevel: presetDefaults.proactivityLevel
      }),
      metadata: buildProductAgentMetadata({
        mode: presetDefaults.mode,
        tone: presetDefaults.tone,
        relationshipMode: presetDefaults.relationshipMode,
        boundaries: presetDefaults.boundaries,
        proactivityLevel: presetDefaults.proactivityLevel,
        backgroundSummary: presetDefaults.backgroundSummary,
        avatarStyle: presetDefaults.avatarStyle,
        avatarGender: presetDefaults.avatarGender,
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
    portraitStyle: presetDefaults.avatarStyle,
    portraitGender: presetDefaults.avatarGender,
    portraitSourceType: "preset",
    portraitAssetId: defaultPortraitAsset?.id ?? existingRoleMedia?.portrait_asset_id ?? null,
    portraitLockedAt:
      typeof existingRoleMedia?.portrait_locked_at === "string"
        ? existingRoleMedia.portrait_locked_at
        : new Date().toISOString(),
    portraitReferenceEnabledByDefault: true,
    audioAssetId:
      presetDefaultVoice?.id ?? defaultVoice?.id ?? existingRoleMedia?.audio_asset_id ?? null,
    audioProvider:
      presetDefaultVoice?.provider ??
      defaultVoice?.provider ??
      existingRoleMedia?.audio_provider ??
      null
  });

  if (roleMediaError) {
    redirectWithMessage(redirectPath, roleMediaError.message, "error");
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
  redirectWithMessage(redirectPath, copy.restored, "success");
}
