import {
  loadActivePersonaPackById,
  loadLatestOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedAvailableAgents,
  loadOwnedUserAppSettingsMetadata,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import {
  resolveProductRoleCore,
  resolveStoredProductRoleAppearance,
  type ProductRoleAppearanceSummary,
  type ProductRoleCoreConfig
} from "@/lib/product/role-core";
import {
  loadActiveAudioAssetById,
  loadActiveAudioAssets,
  formatPortraitAssetLabel,
  formatPortraitSourceLabel,
  formatReferenceModeLabel,
  loadAccessiblePortraitAssetById,
  loadOwnedRoleMediaProfile,
  resolveDefaultImageModelSlug,
  resolveModelDisplayName
} from "@/lib/product/role-media";

export type ProductProfilePageData = {
  workspaceId: string;
  role: {
    agentId: string;
    name: string;
    backgroundSummary: string | null;
    personaSummary: string;
    sourcePersonaPackId: string | null;
    sourcePersonaPackName: string | null;
    sourceCharacterSlug: string | null;
    stylePrompt: string;
    systemPrompt: string;
    currentThreadTitle: string | null;
    appearance: ProductRoleAppearanceSummary;
    config: ProductRoleCoreConfig;
    media: {
      portraitAssetId: string | null;
      portraitAssetLabel: string;
      portraitAssetUrl: string | null;
      portraitSourceLabel: string;
      portraitStyle: string | null;
      portraitGender: string | null;
      portraitReferenceEnabledByDefault: boolean;
      portraitReferenceLabel: string;
      audioAssetId: string | null;
      boundVoiceName: string | null;
      boundVoiceProvider: string | null;
      boundVoiceModelName: string | null;
    };
    mediaLibraries: {
      audioAssets: {
        id: string;
        modelSlug: string;
        displayName: string;
        provider: string;
        styleTags: string[];
        genderPresentation: string | null;
        isDefault: boolean;
      }[];
    };
    accountDefaults: {
      imageModelName: string | null;
    };
  } | null;
};

export async function loadProductProfilePageData(args: {
  supabase: any;
  userId: string;
  agentId?: string | null;
}): Promise<ProductProfilePageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  const latestThreadResult = await loadLatestOwnedThread({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId
  });

  const fallbackAgentsResult = await loadOwnedAvailableAgents({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId
  });

  const selectedAgentId =
    (typeof args.agentId === "string" && args.agentId.length > 0
      ? args.agentId
      : latestThreadResult.data?.agent_id) ??
    fallbackAgentsResult.data?.[0]?.id ??
    null;

  if (!selectedAgentId) {
    return {
      workspaceId: workspace.id,
      role: null
    };
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase: args.supabase,
    agentId: selectedAgentId,
    workspaceId: workspace.id,
    userId: args.userId
  });

  if (!agent) {
    return {
      workspaceId: workspace.id,
      role: null
    };
  }

  const [{ data: appSettings }, { data: roleMediaProfile }, { data: audioAssets }, { data: sourcePersonaPack }] = await Promise.all([
    loadOwnedUserAppSettingsMetadata({
      supabase: args.supabase,
      userId: args.userId
    }),
    loadOwnedRoleMediaProfile({
      supabase: args.supabase,
      agentId: agent.id,
      workspaceId: workspace.id,
      userId: args.userId
    }),
    loadActiveAudioAssets({
      supabase: args.supabase
    }),
    typeof agent.source_persona_pack_id === "string" && agent.source_persona_pack_id.length > 0
      ? loadActivePersonaPackById({
          supabase: args.supabase,
          personaPackId: agent.source_persona_pack_id
        })
      : Promise.resolve({ data: null })
  ]);

  const appSettingsMetadata =
    appSettings?.metadata &&
    typeof appSettings.metadata === "object" &&
    !Array.isArray(appSettings.metadata)
      ? (appSettings.metadata as Record<string, unknown>)
      : {};

  const defaultImageModelSlug = resolveDefaultImageModelSlug(appSettingsMetadata);

  const roleAudioAssetId =
    typeof roleMediaProfile?.audio_asset_id === "string" &&
    roleMediaProfile.audio_asset_id.length > 0
      ? roleMediaProfile.audio_asset_id
      : typeof roleMediaProfile?.audio_voice_option_id === "string" &&
          roleMediaProfile.audio_voice_option_id.length > 0
        ? roleMediaProfile.audio_voice_option_id
        : null;

  const { data: boundVoiceOption } = roleAudioAssetId
      ? await loadActiveAudioAssetById({
          supabase: args.supabase,
          audioAssetId: roleAudioAssetId
        })
      : { data: null };

  const { data: portraitAsset } =
    typeof roleMediaProfile?.portrait_asset_id === "string" &&
    roleMediaProfile.portrait_asset_id.length > 0
      ? await loadAccessiblePortraitAssetById({
          supabase: args.supabase,
          portraitAssetId: roleMediaProfile.portrait_asset_id
        })
      : { data: null };

  return {
    workspaceId: workspace.id,
    role: {
      agentId: agent.id,
      name: agent.name,
      backgroundSummary:
        agent.metadata &&
        typeof agent.metadata === "object" &&
        !Array.isArray(agent.metadata) &&
        typeof (agent.metadata as Record<string, unknown>).background_summary === "string" &&
        ((agent.metadata as Record<string, unknown>).background_summary as string).trim().length > 0
          ? ((agent.metadata as Record<string, unknown>).background_summary as string)
          : null,
      personaSummary: agent.persona_summary,
      sourcePersonaPackId:
        typeof agent.source_persona_pack_id === "string" ? agent.source_persona_pack_id : null,
      sourcePersonaPackName:
        typeof sourcePersonaPack?.name === "string" ? sourcePersonaPack.name : null,
      sourceCharacterSlug:
        sourcePersonaPack?.metadata &&
        typeof sourcePersonaPack.metadata === "object" &&
        !Array.isArray(sourcePersonaPack.metadata) &&
        typeof (sourcePersonaPack.metadata as Record<string, unknown>).character_slug === "string"
          ? ((sourcePersonaPack.metadata as Record<string, unknown>).character_slug as string)
          : null,
      stylePrompt: agent.style_prompt,
      systemPrompt: agent.system_prompt,
      currentThreadTitle:
        latestThreadResult.data?.agent_id === agent.id ? latestThreadResult.data.title : null,
      appearance: resolveStoredProductRoleAppearance(agent.metadata),
      config: resolveProductRoleCore({
        metadata: agent.metadata,
        stylePrompt: agent.style_prompt,
        systemPrompt: agent.system_prompt
      }),
      media: {
        portraitAssetId:
          typeof roleMediaProfile?.portrait_asset_id === "string"
            ? roleMediaProfile.portrait_asset_id
            : null,
        portraitAssetLabel: formatPortraitAssetLabel({
          displayName:
            typeof portraitAsset?.display_name === "string"
              ? portraitAsset.display_name
              : null,
          sourceType:
            typeof portraitAsset?.source_type === "string"
              ? portraitAsset.source_type
              : roleMediaProfile?.portrait_source_type
        }),
        portraitSourceLabel: formatPortraitSourceLabel(roleMediaProfile?.portrait_source_type),
        portraitAssetUrl:
          typeof portraitAsset?.public_url === "string" && portraitAsset.public_url.length > 0
            ? portraitAsset.public_url
            : typeof portraitAsset?.storage_path === "string" &&
                portraitAsset.storage_path.startsWith("character-assets/")
              ? args.supabase.storage
                  .from("character-assets")
                  .getPublicUrl(portraitAsset.storage_path.replace(/^character-assets\//, "")).data.publicUrl
              : null,
        portraitStyle:
          typeof roleMediaProfile?.portrait_style === "string"
            ? roleMediaProfile.portrait_style
            : null,
        portraitGender:
          typeof roleMediaProfile?.portrait_gender === "string"
            ? roleMediaProfile.portrait_gender
            : null,
        portraitReferenceEnabledByDefault:
          roleMediaProfile?.portrait_reference_enabled_by_default ?? true,
        portraitReferenceLabel: formatReferenceModeLabel(
          roleMediaProfile?.portrait_reference_enabled_by_default ?? true
        ),
        audioAssetId: roleAudioAssetId,
        boundVoiceName:
          typeof boundVoiceOption?.display_name === "string"
            ? boundVoiceOption.display_name
            : null,
        boundVoiceProvider:
          typeof boundVoiceOption?.provider === "string"
            ? boundVoiceOption.provider
            : typeof roleMediaProfile?.audio_provider === "string"
              ? roleMediaProfile.audio_provider
              : null,
        boundVoiceModelName: resolveModelDisplayName(
          typeof boundVoiceOption?.model_slug === "string"
            ? boundVoiceOption.model_slug
            : null
        )
      },
      mediaLibraries: {
        audioAssets: Array.isArray(audioAssets)
          ? audioAssets.map((item: any) => ({
              id: item.id,
              modelSlug: typeof item.model_slug === "string" ? item.model_slug : "",
              displayName: typeof item.display_name === "string" ? item.display_name : "Voice",
              provider: typeof item.provider === "string" ? item.provider : "",
              styleTags: Array.isArray(item.style_tags)
                ? item.style_tags.filter((t: unknown): t is string => typeof t === "string")
                : [],
              genderPresentation:
                typeof item.gender_presentation === "string" ? item.gender_presentation : null,
              isDefault: item.is_default === true
            }))
          : []
      },
      accountDefaults: {
        imageModelName: resolveModelDisplayName(defaultImageModelSlug),
      }
    }
  };
}
