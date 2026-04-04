"use server";

import { redirect } from "next/navigation";
import { CHARACTER_MANIFEST, type CharacterSlug } from "@/lib/characters/manifest";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";
import {
  createOwnedAgent,
  createOwnedThread,
  loadActivePersonaPackBySlug,
  loadActiveModelProfileBySlug,
  loadOwnedUserAppSettingsMetadata,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import {
  buildProductAgentMetadata,
  buildProductPersonaSummary,
  safeProductRoleAvatarGender,
  safeProductRoleAvatarStyle,
  buildProductStylePrompt,
  buildProductSystemPrompt,
  safeProductRoleMode,
  safeProductRoleTone,
  trimProductText
} from "@/lib/product/role-core";
import {
  loadAccessiblePortraitAssetById,
  loadActiveAudioVoiceOptionsByModelSlug,
  loadActiveAudioAssetById,
  pickDefaultAudioVoiceOptionForCharacter,
  pickRecommendedAudioVoiceOption,
  resolveConsumableAudioAsset,
  resolveDefaultAudioModelSlug,
  upsertOwnedRoleMediaProfile
} from "@/lib/product/role-media";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";

function safeCharacterSlug(value: string): CharacterSlug | null {
  if (value === "caria" || value === "teven" || value === "velia") {
    return value;
  }

  return null;
}

function detectAvatarStyleFromPreset(presetId: string) {
  if (["aurora", "luna", "sage", "ember", "atlas", "river", "orion"].includes(presetId)) {
    return safeProductRoleAvatarStyle("realistic");
  }

  if (["hana", "yuki", "akari", "kaito", "ren"].includes(presetId)) {
    return safeProductRoleAvatarStyle("anime");
  }

  if (["nova", "echo"].includes(presetId)) {
    return safeProductRoleAvatarStyle("illustrated");
  }

  return null;
}

function resolveCreateSurfacePath(value: string) {
  return value === "/app/create" ? "/app/create" : "/create";
}

function buildCreateErrorPath(args: {
  surfacePath: string;
  message: string;
  presetSlug: CharacterSlug | null;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("error", args.message);

  if (args.presetSlug) {
    searchParams.set("preset", args.presetSlug);
  }

  return `${args.surfacePath}?${searchParams.toString()}`;
}

export async function createProductRole(formData: FormData) {
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const surfacePath = resolveCreateSurfacePath(trimProductText(formData.get("create_surface")));
  const presetSlug = safeCharacterSlug(trimProductText(formData.get("preset_slug")));

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(surfacePath)}`);
  }

  const redirectAfter = trimProductText(formData.get("redirect_after"));
  const mode = safeProductRoleMode(trimProductText(formData.get("mode")));
  const avatarPresetId = trimProductText(formData.get("avatar_preset"));
  const portraitAssetId = trimProductText(formData.get("portrait_asset_id"));
  const selectedAudioAssetId = trimProductText(formData.get("audio_asset_id"));
  const recommendedAudioAssetId = trimProductText(formData.get("recommended_audio_asset_id"));
  const avatarGender = safeProductRoleAvatarGender(trimProductText(formData.get("avatar_gender")));
  const presetDefinition = presetSlug ? CHARACTER_MANIFEST[presetSlug] : null;
  const name =
    trimProductText(formData.get("name")) ||
    (presetDefinition?.displayName ??
      (avatarGender === "female"
        ? "Caria"
        : avatarGender === "male"
          ? "Teven"
          : mode === "assistant"
            ? "Velia"
            : "Nova"));
  const userPreferredName = trimProductText(formData.get("user_preferred_name")) || null;
  const tone = safeProductRoleTone(trimProductText(formData.get("tone")));
  const relationshipMode =
    trimProductText(formData.get("relationship_mode")) || "long-term companion";
  const boundaries =
    trimProductText(formData.get("boundaries")) ||
    (isZh ? "保持支持与尊重，避免操控或强迫行为。" : "Be supportive, respectful, and avoid manipulative or coercive behavior.");
  const backgroundSummary = trimProductText(formData.get("background_summary")) || null;
  let avatarStyle = avatarPresetId ? detectAvatarStyleFromPreset(avatarPresetId) : null;

  if (portraitAssetId) {
    const { data: portraitAsset } = await loadAccessiblePortraitAssetById({
      supabase,
      portraitAssetId
    });

    if (!portraitAsset) {
      redirect(
        buildCreateErrorPath({
          surfacePath,
          message: "Selected portrait asset is unavailable.",
          presetSlug
        })
      );
    }

    if (Array.isArray(portraitAsset.style_tags)) {
      const matchedStyle = portraitAsset.style_tags.find(
        (item: unknown): item is "realistic" | "anime" | "illustrated" =>
          item === "realistic" || item === "anime" || item === "illustrated"
      );
      avatarStyle = matchedStyle ? safeProductRoleAvatarStyle(matchedStyle) : avatarStyle;
    }
  }

  const personaPackPromise = presetDefinition
    ? loadActivePersonaPackBySlug({
        supabase,
        slug: presetDefinition.personaPackSlug
      })
    : Promise.resolve({ data: null });

  const [{ data: workspace }, { data: appSettings }, { data: personaPack }] =
    await Promise.all([
      loadPrimaryWorkspace({
        supabase,
        userId: user.id
      }),
      loadOwnedUserAppSettingsMetadata({
        supabase,
        userId: user.id
      }),
      personaPackPromise
    ]);

  const appSettingsMetadata =
    appSettings?.metadata &&
    typeof appSettings.metadata === "object" &&
    !Array.isArray(appSettings.metadata)
      ? (appSettings.metadata as Record<string, unknown>)
      : {};
  const preferredAudioModelSlug = resolveDefaultAudioModelSlug(appSettingsMetadata);
  const preferredTextModelSlug =
    typeof appSettingsMetadata.default_text_model_slug === "string" &&
    appSettingsMetadata.default_text_model_slug.trim().length > 0
      ? appSettingsMetadata.default_text_model_slug.trim()
      : "text-core-lite";
  const { data: modelProfile } = await loadActiveModelProfileBySlug({
    supabase,
    slug: preferredTextModelSlug
  });

  if (!workspace || !modelProfile || (presetDefinition && !personaPack)) {
    redirect(
      buildCreateErrorPath({
        surfacePath,
        message: "Missing workspace, model profile, or persona pack.",
        presetSlug
      })
    );
  }

  const { data: createdAgent, error: agentError } = await createOwnedAgent({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    sourcePersonaPackId: personaPack?.id ?? null,
    name,
    personaSummary: buildProductPersonaSummary({
      mode,
      avatarGender,
      tone,
      relationshipMode
    }),
    stylePrompt: buildProductStylePrompt(tone),
    systemPrompt: buildProductSystemPrompt({
      name,
      mode,
      avatarGender,
      tone,
      relationshipMode,
      boundaries,
      proactivityLevel: "balanced",
      userPreferredName
    }),
    defaultModelProfileId: modelProfile.id,
    isCustom: true,
      metadata: buildProductAgentMetadata({
        mode,
        tone,
        relationshipMode,
        boundaries,
        proactivityLevel: "balanced",
        backgroundSummary,
        userPreferredName,
        avatarPresetId: avatarPresetId || null,
      avatarStyle,
      avatarGender,
      avatarOrigin: avatarPresetId ? "preset" : null
    }),
    select: "id, name, persona_summary"
  });

  if (agentError || !createdAgent) {
    redirect(
      buildCreateErrorPath({
        surfacePath,
        message: agentError?.message ?? "Failed to create role.",
        presetSlug
      })
    );
  }

  if (preferredAudioModelSlug || selectedAudioAssetId || recommendedAudioAssetId) {
    const currentPlanSlug = await loadCurrentProductPlanSlug({
      supabase,
      userId: user.id
    });
    const { data: audioVoiceOptions } = await loadActiveAudioVoiceOptionsByModelSlug({
      supabase,
      modelSlug: preferredAudioModelSlug ?? "audio-minimax-speech"
    });
    const voiceOptions = Array.isArray(audioVoiceOptions) ? audioVoiceOptions : [];
    const presetDefaultVoice = pickDefaultAudioVoiceOptionForCharacter({
      options: voiceOptions,
      characterSlug: presetSlug
    });
    const recommendedVoice = pickRecommendedAudioVoiceOption({
      options: voiceOptions,
      avatarGender,
      tone
    });
    const requestedAudioAssetId =
      selectedAudioAssetId ||
      recommendedAudioAssetId ||
      presetDefaultVoice?.id ||
      recommendedVoice?.id ||
      null;
    const fallbackVoiceId = presetDefaultVoice?.id ?? recommendedVoice?.id ?? null;
    const { data: resolvedAudioAsset } = requestedAudioAssetId
      ? await resolveConsumableAudioAsset({
          supabase,
          currentPlanSlug: currentPlanSlug === "pro" ? "pro" : "free",
          requestedAudioAssetId
        })
      : { data: null };
    const selectedAudioAsset = resolvedAudioAsset
      ? resolvedAudioAsset
      : fallbackVoiceId
        ? (await loadActiveAudioAssetById({
            supabase,
            audioAssetId: fallbackVoiceId
          })).data
        : null;

    await upsertOwnedRoleMediaProfile({
      supabase,
      agentId: createdAgent.id,
      workspaceId: workspace.id,
      userId: user.id,
      portraitPresetId: avatarPresetId || null,
      portraitStyle: avatarStyle,
      portraitGender: avatarGender,
      portraitSourceType: portraitAssetId || avatarPresetId ? "preset" : null,
      portraitAssetId: portraitAssetId || null,
      portraitLockedAt: portraitAssetId || avatarPresetId ? new Date().toISOString() : null,
      audioAssetId: selectedAudioAsset?.id ?? null,
      audioProvider:
        selectedAudioAsset?.provider ??
        presetDefaultVoice?.provider ??
        recommendedVoice?.provider ??
        null
    });
  }

  const { data: createdThread, error: threadError } = await createOwnedThread({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    agentId: createdAgent.id,
    title: `${createdAgent.name} relationship thread`
  });

  if (threadError || !createdThread) {
    redirect(
      buildCreateErrorPath({
        surfacePath,
        message: threadError?.message ?? "Failed to create thread.",
        presetSlug
      })
    );
  }

  if (redirectAfter) {
    redirect(
      `${redirectAfter}?role=${encodeURIComponent(createdAgent.id)}&feedback=${encodeURIComponent(`${createdAgent.name} created`)}&feedback_type=success`
    );
  }

  redirect(
    `/connect-im?thread=${encodeURIComponent(createdThread.id)}&agent=${encodeURIComponent(
      createdAgent.id
    )}&created=1`
  );
}
