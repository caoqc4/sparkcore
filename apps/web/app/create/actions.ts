"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createOwnedAgent,
  createOwnedThread,
  loadActiveModelProfileBySlug,
  loadFirstActivePersonaPack,
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
  loadActiveAudioVoiceOptionsByModelSlug,
  pickRecommendedAudioVoiceOption,
  resolveDefaultAudioModelSlug,
  upsertOwnedRoleMediaProfile
} from "@/lib/product/role-media";

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

export async function createProductRole(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fcreate");
  }

  const redirectAfter = trimProductText(formData.get("redirect_after"));
  const mode = safeProductRoleMode(trimProductText(formData.get("mode")));
  const avatarPresetId = trimProductText(formData.get("avatar_preset"));
  const avatarGender = safeProductRoleAvatarGender(trimProductText(formData.get("avatar_gender")));
  const name =
    trimProductText(formData.get("name")) ||
    (avatarGender === "female" ? "Caria" : avatarGender === "male" ? "Teven" : mode === "assistant" ? "Velia" : "Nova");
  const userPreferredName = trimProductText(formData.get("user_preferred_name")) || null;
  const tone = safeProductRoleTone(trimProductText(formData.get("tone")));
  const relationshipMode =
    trimProductText(formData.get("relationship_mode")) || "long-term companion";
  const boundaries =
    trimProductText(formData.get("boundaries")) ||
    "Be supportive, respectful, and avoid manipulative or coercive behavior.";
  const avatarStyle = avatarPresetId ? detectAvatarStyleFromPreset(avatarPresetId) : null;

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
      loadFirstActivePersonaPack({ supabase })
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

  if (!workspace || !modelProfile || !personaPack) {
    redirect("/create?error=Missing+workspace,+model+profile,+or+persona+pack.");
  }

  const { data: createdAgent, error: agentError } = await createOwnedAgent({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    sourcePersonaPackId: personaPack.id,
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
      userPreferredName,
      avatarPresetId: avatarPresetId || null,
      avatarStyle,
      avatarGender,
      avatarOrigin: avatarPresetId ? "preset" : null
    }),
    select: "id, name, persona_summary"
  });

  if (agentError || !createdAgent) {
    redirect(`/create?error=${encodeURIComponent(agentError?.message ?? "Failed to create role.")}`);
  }

  if (preferredAudioModelSlug) {
    const { data: audioVoiceOptions } = await loadActiveAudioVoiceOptionsByModelSlug({
      supabase,
      modelSlug: preferredAudioModelSlug
    });
    const recommendedVoice = pickRecommendedAudioVoiceOption({
      options: Array.isArray(audioVoiceOptions) ? audioVoiceOptions : [],
      avatarGender,
      tone
    });

    await upsertOwnedRoleMediaProfile({
      supabase,
      agentId: createdAgent.id,
      workspaceId: workspace.id,
      userId: user.id,
      portraitPresetId: avatarPresetId || null,
      portraitStyle: avatarStyle,
      portraitGender: avatarGender,
      portraitSourceType: avatarPresetId ? "preset" : null,
      audioAssetId: recommendedVoice?.id ?? null,
      audioProvider: recommendedVoice?.provider ?? null
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
    redirect(`/create?error=${encodeURIComponent(threadError?.message ?? "Failed to create thread.")}`);
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
