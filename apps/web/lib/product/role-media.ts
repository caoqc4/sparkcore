import {
  PRODUCT_MODEL_CATALOG,
  getVisibleAudioModelSlugs,
  getProductModelCatalogItemBySlug
} from "@/lib/product/model-catalog";
import type {
  ProductRoleAvatarGender,
  ProductRoleTone
} from "@/lib/product/role-core";

export type AssetEligibleMode = "companion" | "assistant";

export type ProductAudioVoiceOptionRow = {
  id: string;
  model_slug: string;
  provider: string;
  voice_key: string;
  display_name: string;
  gender_presentation: string | null;
  style_tags: unknown;
  eligible_modes?: unknown;
  metadata?: unknown;
  tier?: string | null;
  sort_order: number;
  is_default: boolean;
};

export type ProductPortraitAssetRow = {
  id: string;
  provider: string | null;
  source_type: string;
  storage_path: string | null;
  public_url: string | null;
  display_name: string | null;
  gender_presentation: string | null;
  style_tags: unknown;
  eligible_modes?: unknown;
  metadata?: unknown;
};

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function isEligibleForMode(
  eligibleModes: unknown,
  roleMode: AssetEligibleMode | null | undefined
): boolean {
  const modes = asStringArray(eligibleModes);
  // Empty array = no restriction
  if (modes.length === 0) return true;
  if (!roleMode) return true;
  return modes.includes(roleMode);
}

function getToneAffinityTags(tone: ProductRoleTone) {
  switch (tone) {
    case "playful":
      return ["Bright", "Expressive", "Soft"];
    case "steady":
      return ["Calm", "Grounded", "Clear"];
    case "warm":
    default:
      return ["Warm", "Soft", "Calm"];
  }
}

export function resolveDefaultAudioModelSlug(metadata: Record<string, unknown>) {
  const configured =
    typeof metadata.default_audio_model_slug === "string"
      ? metadata.default_audio_model_slug.trim()
      : "";

  if (configured.length > 0) {
    return configured;
  }

  const freeDefault = PRODUCT_MODEL_CATALOG.find(
    (item) =>
      item.capability === "audio" &&
      item.tier === "free" &&
      item.isDefault
  );

  if (freeDefault) {
    return freeDefault.slug;
  }

  const anyDefault = PRODUCT_MODEL_CATALOG.find(
    (item) => item.capability === "audio" && item.isDefault
  );

  return anyDefault?.slug ?? null;
}

export function resolveDefaultImageModelSlug(metadata: Record<string, unknown>) {
  const configured =
    typeof metadata.default_image_model_slug === "string"
      ? metadata.default_image_model_slug.trim()
      : "";

  if (configured.length > 0) {
    return configured;
  }

  const freeDefault = PRODUCT_MODEL_CATALOG.find(
    (item) =>
      item.capability === "image" &&
      item.tier === "free" &&
      item.isDefault
  );

  if (freeDefault) {
    return freeDefault.slug;
  }

  const anyDefault = PRODUCT_MODEL_CATALOG.find(
    (item) => item.capability === "image" && item.isDefault
  );

  return anyDefault?.slug ?? null;
}

export function resolveConsumableImageModelSlug(args: {
  currentPlanSlug: string;
  requestedModelSlug: string | null;
}) {
  const requested =
    typeof args.requestedModelSlug === "string" && args.requestedModelSlug.length > 0
      ? getProductModelCatalogItemBySlug(args.requestedModelSlug)
      : null;

  if (requested && (args.currentPlanSlug === "pro" || requested.tier === "free")) {
    return requested.slug;
  }

  const fallbackFreeDefault = PRODUCT_MODEL_CATALOG.find(
    (item) => item.capability === "image" && item.tier === "free" && item.isDefault
  );

  return fallbackFreeDefault?.slug ?? requested?.slug ?? null;
}

export async function loadActiveAudioVoiceOptionsByModelSlug(args: {
  supabase: any;
  modelSlug: string;
}) {
  return args.supabase
    .from("product_audio_voice_options")
    .select(
      "id, model_slug, provider, voice_key, display_name, gender_presentation, style_tags, eligible_modes, metadata, tier, sort_order, is_default"
    )
    .eq("model_slug", args.modelSlug)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("sort_order", { ascending: true });
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function metadataMatchesCharacterSlug(metadata: unknown, characterSlug: string) {
  const record = asRecord(metadata);
  const single =
    typeof record.default_for_character === "string"
      ? record.default_for_character.trim()
      : "";

  if (single === characterSlug) {
    return true;
  }

  const multi = Array.isArray(record.default_for_characters)
    ? record.default_for_characters.filter((item): item is string => typeof item === "string")
    : [];

  return multi.includes(characterSlug);
}

export function filterAudioVoiceOptionsForRole(args: {
  options: ProductAudioVoiceOptionRow[];
  avatarGender: ProductRoleAvatarGender | null;
  tone: ProductRoleTone;
  currentPlanSlug: "free" | "pro";
  roleMode?: AssetEligibleMode | null;
}) {
  const tierAllowed = args.options.filter(
    (option) => args.currentPlanSlug === "pro" || option.tier !== "pro"
  );
  const modeFiltered = tierAllowed.filter((option) =>
    isEligibleForMode(option.eligible_modes, args.roleMode ?? null)
  );
  const genderFiltered = modeFiltered.filter((option) => {
    if (!args.avatarGender) {
      return true;
    }

    return (
      option.gender_presentation === null ||
      option.gender_presentation === "neutral" ||
      option.gender_presentation === args.avatarGender
    );
  });
  const base = genderFiltered.length > 0 ? genderFiltered : modeFiltered;
  const preferredToneTags = new Set(getToneAffinityTags(args.tone));
  const toneFiltered = base.filter((option) =>
    asStringArray(option.style_tags).some((tag) => preferredToneTags.has(tag))
  );

  return toneFiltered.length > 0 ? toneFiltered : base;
}

export function filterPortraitAssetsForMode<T extends { eligible_modes?: unknown }>(
  assets: T[],
  roleMode: AssetEligibleMode | null | undefined
): T[] {
  return assets.filter((asset) => isEligibleForMode(asset.eligible_modes, roleMode ?? null));
}

export function pickRecommendedAudioVoiceOption(args: {
  options: ProductAudioVoiceOptionRow[];
  avatarGender: ProductRoleAvatarGender | null;
  tone: ProductRoleTone;
}) {
  const preferredToneTags = new Set(getToneAffinityTags(args.tone));

  const ranked = [...args.options].sort((left, right) => {
    const leftTags = asStringArray(left.style_tags);
    const rightTags = asStringArray(right.style_tags);

    const leftGenderMatch =
      args.avatarGender && left.gender_presentation === args.avatarGender ? 1 : 0;
    const rightGenderMatch =
      args.avatarGender && right.gender_presentation === args.avatarGender ? 1 : 0;

    const leftToneMatch = leftTags.some((tag) => preferredToneTags.has(tag)) ? 1 : 0;
    const rightToneMatch = rightTags.some((tag) => preferredToneTags.has(tag)) ? 1 : 0;

    return (
      rightGenderMatch - leftGenderMatch ||
      rightToneMatch - leftToneMatch ||
      Number(right.is_default) - Number(left.is_default) ||
      left.sort_order - right.sort_order ||
      left.display_name.localeCompare(right.display_name)
    );
  });

  return ranked[0] ?? null;
}

export function pickDefaultAudioVoiceOptionForCharacter(args: {
  options: ProductAudioVoiceOptionRow[];
  characterSlug: string | null;
}) {
  if (!args.characterSlug) {
    return null;
  }

  return (
    args.options.find((option) =>
      metadataMatchesCharacterSlug(option.metadata, args.characterSlug as string)
    ) ?? null
  );
}

export async function upsertOwnedRoleMediaProfile(args: {
  supabase: any;
  agentId: string;
  workspaceId: string;
  userId: string;
  portraitPresetId: string | null;
  portraitStyle: string | null;
  portraitGender: string | null;
  portraitSourceType: string | null;
  portraitAssetId?: string | null;
  portraitLockedAt?: string | null;
  portraitReferenceEnabledByDefault?: boolean;
  audioAssetId: string | null;
  audioProvider: string | null;
}) {
  return args.supabase.from("role_media_profiles").upsert(
    {
      agent_id: args.agentId,
      workspace_id: args.workspaceId,
      owner_user_id: args.userId,
      portrait_preset_id: args.portraitPresetId,
      portrait_style: args.portraitStyle,
      portrait_gender: args.portraitGender,
      portrait_source_type: args.portraitSourceType,
      portrait_asset_id: args.portraitAssetId ?? null,
      portrait_locked_at: args.portraitLockedAt ?? null,
      portrait_reference_enabled_by_default:
        args.portraitReferenceEnabledByDefault ?? true,
      audio_asset_id: args.audioAssetId,
      audio_voice_option_id: args.audioAssetId,
      audio_provider: args.audioProvider,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "agent_id"
    }
  );
}

export async function loadOwnedRoleMediaProfile(args: {
  supabase: any;
  agentId: string;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("role_media_profiles")
    .select(
      "id, portrait_asset_id, portrait_preset_id, portrait_style, portrait_gender, portrait_source_type, portrait_public_url, portrait_reference_enabled_by_default, portrait_style_notes, portrait_locked_at, audio_asset_id, audio_voice_option_id, audio_provider"
    )
    .eq("agent_id", args.agentId)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .maybeSingle();
}

export async function loadAccessiblePortraitAssetById(args: {
  supabase: any;
  portraitAssetId: string;
}) {
  return args.supabase
    .from("product_portrait_assets")
    .select(
      "id, provider, source_type, storage_path, public_url, display_name, gender_presentation, style_tags, eligible_modes, metadata"
    )
    .eq("id", args.portraitAssetId)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadAccessiblePortraitAssets(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase
    .from("product_portrait_assets")
    .select(
      "id, provider, source_type, public_url, display_name, gender_presentation, style_tags, eligible_modes, is_shared"
    )
    .eq("is_active", true)
    .or(`is_shared.eq.true,owner_user_id.eq.${args.userId}`)
    .order("is_shared", { ascending: false })
    .order("display_name", { ascending: true });
}

export async function loadSharedPresetPortraitAssets(args: {
  supabase: any;
}) {
  return args.supabase
    .from("product_portrait_assets")
    .select(
      "id, provider, source_type, storage_path, public_url, display_name, gender_presentation, style_tags, eligible_modes, metadata"
    )
    .eq("is_active", true)
    .eq("is_shared", true)
    .eq("source_type", "preset")
    .order("display_name", { ascending: true });
}

export async function loadSharedPresetPortraitAssetByCharacterSlug(args: {
  supabase: any;
  characterSlug: string;
}) {
  return args.supabase
    .from("product_portrait_assets")
    .select(
      "id, provider, source_type, storage_path, public_url, display_name, gender_presentation, style_tags, eligible_modes, metadata"
    )
    .eq("is_active", true)
    .eq("is_shared", true)
    .eq("source_type", "preset")
    .contains("metadata", { character_slug: args.characterSlug, variant: "main" })
    .maybeSingle();
}

export async function loadActiveAudioVoiceOptionById(args: {
  supabase: any;
  voiceOptionId: string;
}) {
  return args.supabase
    .from("product_audio_voice_options")
    .select("id, model_slug, provider, display_name, voice_key, style_tags, metadata")
    .eq("id", args.voiceOptionId)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadActiveAudioAssetById(args: {
  supabase: any;
  audioAssetId: string;
}) {
  return loadActiveAudioVoiceOptionById({
    supabase: args.supabase,
    voiceOptionId: args.audioAssetId
  });
}

export async function loadActiveAudioAssets(args: { supabase: any }) {
  const visibleAudioModelSlugs = getVisibleAudioModelSlugs();

  if (visibleAudioModelSlugs.length === 0) {
    return {
      data: [] as any[],
      error: null
    };
  }

  return args.supabase
    .from("product_audio_voice_options")
    .select("id, model_slug, provider, display_name, voice_key, style_tags, eligible_modes, gender_presentation, tier, sort_order, is_default")
    .in("model_slug", visibleAudioModelSlugs)
    .eq("is_active", true)
    .order("provider", { ascending: true })
    .order("model_slug", { ascending: true })
    .order("is_default", { ascending: false })
    .order("display_name", { ascending: true });
}

export async function resolveConsumableAudioAsset(args: {
  supabase: any;
  currentPlanSlug: string;
  requestedAudioAssetId: string | null;
}) {
  const requestedAsset = args.requestedAudioAssetId
    ? await loadActiveAudioAssetById({
        supabase: args.supabase,
        audioAssetId: args.requestedAudioAssetId
      })
    : { data: null, error: null };

  const requestedModelTier =
    requestedAsset.data?.model_slug
      ? getProductModelCatalogItemBySlug(requestedAsset.data.model_slug)?.tier ?? null
      : null;

  if (
    requestedAsset.data &&
    (args.currentPlanSlug === "pro" || requestedModelTier === "free")
  ) {
    return requestedAsset;
  }

  const freeAudioModelSlugs = PRODUCT_MODEL_CATALOG.filter(
    (item) => item.capability === "audio" && item.tier === "free"
  ).map((item) => item.slug);

  if (freeAudioModelSlugs.length === 0) {
    return { data: null, error: null };
  }

  return args.supabase
    .from("product_audio_voice_options")
    .select("id, model_slug, provider, display_name, voice_key, style_tags, metadata")
    .in("model_slug", freeAudioModelSlugs)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("display_name", { ascending: true })
    .limit(1)
    .maybeSingle();
}

export function formatPortraitSourceLabel(value: string | null | undefined) {
  switch (value) {
    case "preset":
      return "Preset portrait";
    case "upload":
      return "Uploaded reference";
    case "generated":
      return "Generated reference";
    default:
      return "No portrait source yet";
  }
}

export function formatPortraitAssetLabel(args: {
  displayName?: string | null;
  sourceType?: string | null;
}) {
  const sourceLabel = formatPortraitSourceLabel(args.sourceType);

  if (args.displayName && args.displayName.trim().length > 0) {
    return `${args.displayName} · ${sourceLabel}`;
  }

  return sourceLabel;
}

export function formatReferenceModeLabel(enabled: boolean) {
  return enabled ? "Uses role portrait by default" : "Reference is off by default";
}

export function resolveModelDisplayName(slug: string | null | undefined) {
  return getProductModelCatalogItemBySlug(slug)?.displayName ?? null;
}
