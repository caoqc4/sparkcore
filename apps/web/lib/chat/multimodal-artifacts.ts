import { FIXED_IMAGE_MODEL_SLUG } from "@/lib/ai/fixed-models";
import { synthesizeAudioForVoiceOption } from "@/lib/audio/synthesis";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import {
  detectMultimodalIntent,
  extractExplicitAudioContent,
  type MultimodalIntentDecision,
} from "@/lib/chat/multimodal-intent-decision";
import { loadScopedMessageById } from "@/lib/chat/message-read";
import { updateScopedMessage } from "@/lib/chat/message-persistence";
import { generateImage } from "@/lib/ai/client";
import {
  CapabilityBillingError,
  authorizeCapabilityConsumption,
  refundCapabilityConsumption,
} from "@/lib/product/capability-billing";
import { getProductModelCatalogItemBySlug } from "@/lib/product/model-catalog";
import {
  loadCurrentProductPlanSlug,
  type BillingTransientRetryEvent,
} from "@/lib/product/billing";
import { resolveStoredProductRoleAppearance } from "@/lib/product/role-core";
import {
  loadActiveAudioAssetById,
  loadAccessiblePortraitAssetById,
  loadOwnedRoleMediaProfile,
  resolveConsumableAudioAsset,
  resolveConsumableImageModelSlug,
  resolveDefaultImageModelSlug,
} from "@/lib/product/role-media";

type MessageTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
  assistantMessageId: string;
  agentId: string;
};

type ArtifactBilling = {
  mode: "allowance" | "credits" | "soft_unlimited";
  debitedCredits: number;
  allowanceConsumed: number;
  balanceAfter: number | null;
  usageAfter: number | null;
  includedUnits: number | null;
  usagePeriodStart: string | null;
  usagePeriodEnd: string | null;
};

type ImageArtifactRecord = {
  id: string;
  type: "image";
  status: "ready" | "failed";
  source: "intent";
  modelSlug: string;
  referenceStrength: "none" | "light" | "strong";
  referenceSource: "role_portrait" | null;
  referenceImageUrl: string | null;
  prompt: string;
  url: string | null;
  alt: string;
  createdAt: string;
  error?: string | null;
  billing: ArtifactBilling;
};

type AudioArtifactRecord = {
  id: string;
  type: "audio";
  status: "ready" | "failed";
  source: "intent" | "ambient_context";
  modelSlug: string;
  provider: string;
  voiceName: string | null;
  contentType: string | null;
  url: string | null;
  transcript: string;
  createdAt: string;
  error?: string | null;
  billing: ArtifactBilling;
};

type ArtifactRecord = ImageArtifactRecord | AudioArtifactRecord;

type RecentImageArtifactSummary = {
  prompt: string | null;
  alt: string | null;
  createdAt: string | null;
};

type UserAudioPolicy = {
  intentEnabled: boolean;
  ambientEnabled: boolean;
  ambientProbability: number;
  ambientCooldownTurns: number;
  ambientMinChars: number;
  ambientMaxChars: number;
  generationMaxChars: number;
};

export type PreparedExplicitArtifactContext = {
  intent: MultimodalIntentDecision;
  deliveryGate?: {
    clarifyBeforeAction: boolean;
    reason: string | null;
    conflictHint: string | null;
  };
  currentPlanSlug: string;
  userSettingsMetadata: Record<string, unknown>;
  imageResult: Awaited<ReturnType<typeof maybeGenerateImageArtifact>> | null;
  audioTranscriptOverride: string | null;
  billingRetryEvents?: BillingTransientRetryEvent[];
  timingMs?: {
    total: number;
    detect_intent: number;
    load_user_settings: number | null;
    load_current_plan: number | null;
    pre_generate_image: number | null;
  };
};

export type ExplicitArtifactPreparationOverrides = {
  intent?: MultimodalIntentDecision | null;
  deliveryGate?: {
    clarifyBeforeAction: boolean;
    reason: string | null;
    conflictHint: string | null;
  } | null;
};

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

function normalizePlaceConflictText(input: string) {
  return input.normalize("NFKC").trim();
}

function detectSingleTurnIntentGap(args: {
  userMessage: string;
}) {
  const places = [
    { label: "北海", pattern: /北海/u },
    { label: "阿拉斯加", pattern: /阿拉斯加/u },
    { label: "澳洲", pattern: /澳洲|澳大利亚/u },
    { label: "非洲", pattern: /非洲/u },
    { label: "冰岛", pattern: /冰岛/u },
  ];

  const currentMessage = normalizePlaceConflictText(args.userMessage);
  const currentMentions = places.filter((entry) => entry.pattern.test(currentMessage));
  if (currentMentions.length >= 2) {
    return {
      clarifyBeforeAction: true,
      reason: "single_turn_intent_gap",
      conflictHint: `${currentMentions[0]!.label} vs ${currentMentions[1]!.label}`,
    };
  }

  return {
    clarifyBeforeAction: false,
    reason: null,
    conflictHint: null,
  };
}

function buildArtifactRecordId(prefix: "img" | "audio") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getArtifacts(metadata: Record<string, unknown>) {
  const raw = metadata.artifacts;
  return Array.isArray(raw) ? raw.filter((item) => item && typeof item === "object") : [];
}

function normalizeIntentText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeIntentText(value: string) {
  const normalized = normalizeIntentText(value);
  if (!normalized) {
    return [];
  }

  const stopwords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "to",
    "of",
    "for",
    "with",
    "in",
    "on",
    "at",
    "by",
    "me",
    "my",
    "you",
    "your",
    "please",
    "photo",
    "photos",
    "picture",
    "pictures",
    "image",
    "images",
    "关于",
    "一张",
    "照片",
    "图片",
    "相片",
    "给我",
    "分享",
    "一下",
    "可以",
    "有吗"
  ]);

  return normalized
    .split(" ")
    .filter((token) => token.length >= 2 && !stopwords.has(token));
}

function getRecentImageArtifacts(
  messages: Array<{ id: string; metadata: Record<string, unknown> }>
) {
  const results: RecentImageArtifactSummary[] = [];

  for (const message of messages) {
    for (const artifact of getArtifacts(message.metadata)) {
      const record = asRecord(artifact);
      if (record.type !== "image" || record.status !== "ready") {
        continue;
      }

      results.push({
        prompt: getString(record.prompt),
        alt: getString(record.alt),
        createdAt: getString(record.createdAt),
      });
    }
  }

  return results;
}

function buildRecentImageVariationHint(args: {
  userMessage: string;
  recentImages: RecentImageArtifactSummary[];
}) {
  if (args.recentImages.length === 0) {
    return "";
  }

  const currentTokens = new Set(tokenizeIntentText(args.userMessage));
  const recentExamples = args.recentImages
    .slice(0, 2)
    .map((image, index) => {
      const source = image.prompt ?? image.alt ?? "";
      const compact = source.replace(/\s+/g, " ").trim();
      return compact.length > 140
        ? `${index + 1}. ${compact.slice(0, 140)}...`
        : `${index + 1}. ${compact}`;
    })
    .filter((line) => line.length > 0);

  const hasTopicOverlap = args.recentImages.some((image) => {
    const source = `${image.prompt ?? ""} ${image.alt ?? ""}`;
    const tokens = tokenizeIntentText(source);
    let overlap = 0;
    for (const token of tokens) {
      if (currentTokens.has(token)) {
        overlap += 1;
        if (overlap >= 2) {
          return true;
        }
      }
    }
    return false;
  });

  if (!hasTopicOverlap) {
    return "";
  }

  return [
    "Recent images in this thread already explored a similar topic.",
    "Make this image visibly distinct from those recent images.",
    "Change at least two of these dimensions: time of day, camera distance, angle, composition, focal subject, environment details, weather, color palette, or motion.",
    recentExamples.length > 0
      ? `Recent examples to avoid repeating too closely:\n${recentExamples.join("\n")}`
      : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function isPhotoStyleRequest(content: string) {
  const normalized = content.trim().toLowerCase();
  return (
    /照片|相片|拍照|摄影|写真|实拍/.test(content) ||
    /\b(photo|photograph|photographic|realistic|camera|shot|snapshot)\b/i.test(normalized)
  );
}

function getAudioPolicy(metadata: Record<string, unknown>): UserAudioPolicy {
  return {
    intentEnabled:
      typeof metadata.audio_reply_intent_enabled === "boolean"
        ? metadata.audio_reply_intent_enabled
        : true,
    ambientEnabled:
      typeof metadata.audio_reply_context_enabled === "boolean"
        ? metadata.audio_reply_context_enabled
        : true,
    ambientProbability: clamp(getNumber(metadata.audio_reply_context_probability) ?? 0.08, 0, 1),
    ambientCooldownTurns: Math.max(
      1,
      Math.round(getNumber(metadata.audio_reply_context_cooldown_turns) ?? 10)
    ),
    ambientMinChars: Math.max(
      1,
      Math.round(getNumber(metadata.audio_reply_context_min_chars) ?? 28)
    ),
    ambientMaxChars: Math.max(
      32,
      Math.round(getNumber(metadata.audio_reply_context_max_chars) ?? 220)
    ),
    generationMaxChars: Math.max(
      80,
      Math.round(getNumber(metadata.audio_reply_generation_max_chars) ?? 420)
    ),
  };
}

function buildImagePrompt(args: {
  userMessage: string;
  assistantReply?: string;
  agentName: string | null;
  personaSummary: string;
  agentMetadata?: Record<string, unknown> | null;
  recentImageVariationHint?: string;
  referenceStrength?: "none" | "light" | "strong";
  referenceImageUrl?: string | null;
}) {
  const wantsPhotoStyle = isPhotoStyleRequest(args.userMessage);
  const appearance = resolveStoredProductRoleAppearance(args.agentMetadata ?? null);
  const genderLine =
    appearance.avatarGender === "female"
      ? "If a human subject is central and is read as the companion, keep the subject clearly female. Avoid defaulting to a generic male traveler or male point-of-view figure."
      : appearance.avatarGender === "male"
        ? "If a human subject is central and is read as the companion, keep the subject clearly male. Avoid defaulting to a mismatched-gender traveler figure."
        : "";
  const sceneFirstLine =
    "If the user is asking for a place, atmosphere, or scene, prioritize the environment first and avoid adding a dominant generic traveler unless the user explicitly asked for a person.";
  const personaLine =
    args.personaSummary.trim().length > 0
      ? `Role essence to preserve lightly: ${args.personaSummary.trim()}.`
      : "";
  const referenceLine =
    args.referenceImageUrl && args.referenceStrength !== "none"
      ? args.referenceStrength === "strong"
        ? "Use the supplied role portrait as a strong identity reference so the person clearly reads as the same character."
        : "Use the supplied role portrait as a light identity reference so the person loosely preserves the same character features."
      : "";

  if (wantsPhotoStyle) {
    return [
      "Create a realistic photographic image that satisfies the user's request.",
      "Prioritize the requested scene or subject over symbolic companion art.",
      "Respect real-world plausibility unless the user explicitly asks for fantasy, surrealism, or impossible imagery.",
      "Do not invent magical, surreal, or physically implausible elements for a normal photo request.",
      "If the request mentions a moon, sky, water, landscape, or weather scene, keep colors and lighting believable for a real photograph.",
      args.agentName
        ? `If a human subject appears, keep only a subtle visual echo of ${args.agentName}; do not force a character portrait unless the user explicitly asked for a person.`
        : "",
      genderLine,
      personaLine,
      referenceLine,
      `User request: ${args.userMessage.trim()}`,
      "Style target: believable photo, natural lighting, camera-like detail, grounded composition, not an illustration.",
      sceneFirstLine,
      args.recentImageVariationHint?.trim() ?? "",
      "Keep the image tasteful, emotionally warm, and safe for a general audience.",
      "No text overlays unless the user explicitly asked for text in the image.",
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }

  const roleLine = args.agentName
    ? `Character inspiration: ${args.agentName}.`
    : "Character inspiration: the current Lagun companion.";

  return [
    "Create a polished conversational companion image that satisfies the user's request.",
    roleLine,
    genderLine,
    personaLine,
    referenceLine,
    `User request: ${args.userMessage.trim()}`,
    args.assistantReply?.trim()
      ? `Reply context: ${args.assistantReply.trim()}`
      : "",
    args.recentImageVariationHint?.trim() ?? "",
    sceneFirstLine,
    "Keep the composition tasteful, emotionally warm, and safe for a general audience.",
    "Return a single clear image with strong visual focus and no text overlays unless the user explicitly asked for text in the image.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildImageAltText(args: { agentName: string | null; userMessage: string }) {
  const role = args.agentName ? `${args.agentName} image` : "Generated companion image";
  return `${role} based on: ${args.userMessage.trim()}`;
}

function toDataUrl(contentType: string, audioBuffer: ArrayBuffer) {
  return `data:${contentType};base64,${Buffer.from(audioBuffer).toString("base64")}`;
}

function truncateAudioTranscript(text: string, maxChars: number) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxChars);
  const boundary = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("!"), clipped.lastIndexOf("?"), clipped.lastIndexOf("。"), clipped.lastIndexOf("！"), clipped.lastIndexOf("？"));

  if (boundary >= Math.floor(maxChars * 0.5)) {
    return clipped.slice(0, boundary + 1).trim();
  }

  return `${clipped.trimEnd()}...`;
}

async function loadCurrentAssistantMetadata(args: MessageTarget) {
  const { data: message, error } = await loadScopedMessageById({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    select: "metadata",
  });

  if (error) {
    throw new Error(error.message);
  }

  return asRecord(message?.metadata);
}

async function updateAssistantMultimodalMetadata(
  args: MessageTarget & {
    artifact?: ArtifactRecord | null;
    multimodal: Record<string, unknown>;
  }
) {
  const currentMetadata = await loadCurrentAssistantMetadata(args);
  const nextMetadata = {
    ...currentMetadata,
    multimodal: args.multimodal,
    artifacts: args.artifact
      ? [...getArtifacts(currentMetadata), args.artifact]
      : getArtifacts(currentMetadata),
  };

  await updateScopedMessage({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    patch: {
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    },
  });
}

async function loadUserSettingsMetadata(args: { supabase: any; userId: string }) {
  const { data, error } = await args.supabase
    .from("user_app_settings")
    .select("metadata")
    .eq("user_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return asRecord(data?.metadata);
}

async function loadAudioSynthesisContext(
  args: MessageTarget & { currentPlanSlug: string }
) {
  const { data: roleMediaProfile } = await loadOwnedRoleMediaProfile({
    supabase: args.supabase,
    agentId: args.agentId,
    workspaceId: args.workspaceId,
    userId: args.userId,
  });

  const audioAssetId =
    typeof roleMediaProfile?.audio_asset_id === "string" &&
    roleMediaProfile.audio_asset_id.length > 0
      ? roleMediaProfile.audio_asset_id
      : typeof roleMediaProfile?.audio_voice_option_id === "string" &&
          roleMediaProfile.audio_voice_option_id.length > 0
        ? roleMediaProfile.audio_voice_option_id
        : null;

  if (!audioAssetId) {
    return null;
  }

  const { data: audioAsset } = await resolveConsumableAudioAsset({
    supabase: args.supabase,
    currentPlanSlug: args.currentPlanSlug,
    requestedAudioAssetId: audioAssetId,
  });

  if (!audioAsset) {
    return null;
  }

  const voiceKey = getString(audioAsset.voice_key);
  if (!voiceKey) {
    return null;
  }

  return {
    provider: audioAsset.provider,
    modelSlug: audioAsset.model_slug,
    voiceKey,
    voiceName: typeof audioAsset.display_name === "string" ? audioAsset.display_name : null,
    metadata: asRecord(audioAsset.metadata),
  };
}

async function loadRecentAssistantMessages(args: MessageTarget & { limit: number }) {
  const { data, error } = await args.supabase
    .from("messages")
    .select("id, metadata, status, role")
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .eq("role", "assistant")
    .eq("status", "completed")
    .neq("id", args.assistantMessageId)
    .order("created_at", { ascending: false })
    .limit(args.limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item: { id: string; metadata: unknown }) => ({
    id: item.id as string,
    metadata: asRecord(item.metadata),
  }));
}

function countRecentAudioArtifactMessages(messages: Array<{ id: string; metadata: Record<string, unknown> }>) {
  let count = 0;
  for (const message of messages) {
    const hasAudioArtifact = getArtifacts(message.metadata).some((artifact) => {
      const record = asRecord(artifact);
      return record.type === "audio" && record.status === "ready";
    });

    if (hasAudioArtifact) {
      count += 1;
    }
  }

  return count;
}

function buildInsufficientCreditsArtifactBilling(): ArtifactBilling {
  return {
    mode: "allowance",
    debitedCredits: 0,
    allowanceConsumed: 0,
    balanceAfter: null,
    usageAfter: null,
    includedUnits: null,
    usagePeriodStart: null,
    usagePeriodEnd: null,
  };
}

function mapBillingResultToArtifactBilling(
  billingResult: Awaited<ReturnType<typeof authorizeCapabilityConsumption>>
): ArtifactBilling {
  return {
    mode: billingResult.mode,
    debitedCredits: billingResult.debitedCredits,
    allowanceConsumed: billingResult.allowanceConsumed,
    balanceAfter: billingResult.balanceAfter,
    usageAfter: billingResult.usageAfter,
    includedUnits: billingResult.includedUnits,
    usagePeriodStart: billingResult.usagePeriodStart,
    usagePeriodEnd: billingResult.usagePeriodEnd,
  };
}

async function maybeGenerateImageArtifact(
  args: MessageTarget & {
    currentPlanSlug: string;
    userSettingsMetadata: Record<string, unknown>;
    userMessage: string;
    assistantReply: string;
    agentName: string | null;
    personaSummary: string;
    agentMetadata?: Record<string, unknown> | null;
    imageRequested: boolean;
    shouldUseRolePortraitReference?: boolean;
    rolePortraitReferenceStrength?: "none" | "light" | "strong";
  }
) {
  if (!args.imageRequested) {
    return {
      artifact: null as ImageArtifactRecord | null,
      status: "not_requested",
    };
  }

  const selectedImageModelSlug = resolveConsumableImageModelSlug({
    currentPlanSlug: args.currentPlanSlug,
    requestedModelSlug: resolveDefaultImageModelSlug(args.userSettingsMetadata),
  });
  const imageModel =
    getProductModelCatalogItemBySlug(selectedImageModelSlug) ??
    getProductModelCatalogItemBySlug(FIXED_IMAGE_MODEL_SLUG);

  if (!imageModel) {
    return {
      artifact: {
        id: buildArtifactRecordId("img"),
        type: "image",
        status: "failed",
        source: "intent",
        modelSlug: selectedImageModelSlug ?? FIXED_IMAGE_MODEL_SLUG,
        referenceStrength: "none",
        referenceSource: null,
        referenceImageUrl: null,
        prompt: "",
        url: null,
        alt: buildImageAltText({
          agentName: args.agentName,
          userMessage: args.userMessage,
        }),
        createdAt: new Date().toISOString(),
        error: "No active image model is configured for this account.",
        billing: buildInsufficientCreditsArtifactBilling(),
      } satisfies ImageArtifactRecord,
      status: "failed",
    };
  }

  const roleMediaProfile = args.shouldUseRolePortraitReference
    ? (
        await loadOwnedRoleMediaProfile({
          supabase: args.supabase,
          agentId: args.agentId,
          workspaceId: args.workspaceId,
          userId: args.userId
        })
      ).data
    : null;

  const portraitReferenceEnabledByDefault =
    roleMediaProfile?.portrait_reference_enabled_by_default ?? true;
  const requestedReferenceStrength = args.rolePortraitReferenceStrength ?? "none";
  const shouldUsePortraitReference =
    Boolean(args.shouldUseRolePortraitReference) &&
    requestedReferenceStrength !== "none" &&
    (portraitReferenceEnabledByDefault || requestedReferenceStrength === "strong");

  const portraitAssetId =
    shouldUsePortraitReference && typeof roleMediaProfile?.portrait_asset_id === "string"
      ? roleMediaProfile.portrait_asset_id
      : null;
  const portraitAsset = portraitAssetId
    ? (await loadAccessiblePortraitAssetById({
        supabase: args.supabase,
        portraitAssetId
      })).data
    : null;
  const referenceImageUrl =
    resolveCharacterAssetPublicUrl({
      publicUrl:
        getString(portraitAsset?.public_url) ??
        getString(roleMediaProfile?.portrait_public_url),
      storagePath: getString(portraitAsset?.storage_path),
      supabase: args.supabase
    });
  const effectiveReferenceStrength =
    shouldUsePortraitReference && referenceImageUrl ? requestedReferenceStrength : "none";

  const prompt = buildImagePrompt({
    userMessage: args.userMessage,
    assistantReply: args.assistantReply,
    agentName: args.agentName,
    personaSummary: args.personaSummary,
    agentMetadata: args.agentMetadata ?? null,
    referenceStrength: effectiveReferenceStrength,
    referenceImageUrl,
    recentImageVariationHint: buildRecentImageVariationHint({
      userMessage: args.userMessage,
      recentImages: getRecentImageArtifacts(
        await loadRecentAssistantMessages({
          ...args,
          limit: 6,
        })
      ),
    }),
  });

  let billingResult: Awaited<ReturnType<typeof authorizeCapabilityConsumption>> | null = null;

  try {
    billingResult = await authorizeCapabilityConsumption({
      userId: args.userId,
      capabilityType: "image",
      productModelSlug: imageModel.slug,
      reason: "chat_image_generation",
      metadata: {
        assistant_message_id: args.assistantMessageId,
        thread_id: args.threadId,
        prompt_source: "user_intent",
      },
    });

    const image = await generateImage({
      model: imageModel.runtimeModelKey ?? imageModel.slug,
      replicateModelRef: imageModel.replicateModelRef,
      prompt,
      n: 1,
      size: "1024x1024",
      referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : null
    });

    return {
      artifact: {
        id: buildArtifactRecordId("img"),
        type: "image",
        status: "ready",
        source: "intent",
        modelSlug: imageModel.slug,
        referenceStrength: effectiveReferenceStrength,
        referenceSource: referenceImageUrl ? "role_portrait" : null,
        referenceImageUrl,
        prompt,
        url: image.url,
        alt: buildImageAltText({
          agentName: args.agentName,
          userMessage: args.userMessage,
        }),
        createdAt: new Date().toISOString(),
        billing: mapBillingResultToArtifactBilling(billingResult),
      } satisfies ImageArtifactRecord,
      status: "generated",
    };
  } catch (error) {
    if (
      billingResult &&
      (billingResult.debitedCredits > 0 || billingResult.allowanceConsumed > 0)
    ) {
      await refundCapabilityConsumption({
        userId: args.userId,
        capabilityType: "image",
        productModelSlug: imageModel.slug,
        amount: billingResult.debitedCredits,
        allowanceUnits: billingResult.allowanceConsumed,
        metricKey: billingResult.metricKey,
        usagePeriodStart: billingResult.usagePeriodStart,
        usagePeriodEnd: billingResult.usagePeriodEnd,
        reason: "chat_image_generation_refund",
        metadata: {
          assistant_message_id: args.assistantMessageId,
          thread_id: args.threadId,
          reason: "artifact_generation_failed",
        },
      });
    }

    return {
      artifact: {
        id: buildArtifactRecordId("img"),
        type: "image",
        status: "failed",
        source: "intent",
        modelSlug: imageModel.slug,
        referenceStrength: effectiveReferenceStrength,
        referenceSource: referenceImageUrl ? "role_portrait" : null,
        referenceImageUrl,
        prompt,
        url: null,
        alt: buildImageAltText({
          agentName: args.agentName,
          userMessage: args.userMessage,
        }),
        createdAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Image generation failed.",
        billing: buildInsufficientCreditsArtifactBilling(),
      } satisfies ImageArtifactRecord,
      status: "failed",
    };
  }
}

export async function prepareExplicitArtifactContext(
  args: MessageTarget & {
    userMessage: string;
    agentName: string | null;
    personaSummary: string;
    agentMetadata?: Record<string, unknown> | null;
    preGenerateImage?: boolean;
    overrides?: ExplicitArtifactPreparationOverrides | null;
  }
): Promise<PreparedExplicitArtifactContext | null> {
  // Preparation layer only. If centralized intent/gate results are already
  // available, consume them via overrides instead of re-deciding locally.
  // Local fallback stays intentionally narrow: single-turn explicit media intent
  // plus single-turn wording gaps only.
  const prepareStartedAt = nowMs();
  const detectIntentStartedAt = nowMs();
  const intent =
    args.overrides?.intent ?? (await detectMultimodalIntent(args.userMessage));
  const detectIntentDurationMs = elapsedMs(detectIntentStartedAt);

  if (!intent.imageRequested && !intent.audioRequested) {
    return null;
  }

  const deliveryGate =
    args.overrides?.deliveryGate ??
    detectSingleTurnIntentGap({
      userMessage: args.userMessage,
    });

  const billingRetryEvents: BillingTransientRetryEvent[] = [];
  let userSettingsDurationMs: number | null = null;
  let currentPlanDurationMs: number | null = null;

  const [userSettingsMetadata, currentPlanSlug] = await Promise.all([
    (async () => {
      const startedAt = nowMs();
      const value = await loadUserSettingsMetadata({
        supabase: args.supabase,
        userId: args.userId,
      });
      userSettingsDurationMs = elapsedMs(startedAt);
      return value;
    })(),
    (async () => {
      const startedAt = nowMs();
      const value = await loadCurrentProductPlanSlug({
        supabase: args.supabase,
        userId: args.userId,
        onTransientRetry: (event) => {
          billingRetryEvents.push(event);
        },
      });
      currentPlanDurationMs = elapsedMs(startedAt);
      return value;
    })(),
  ]);

  let imagePreGenerateDurationMs: number | null = null;
  const imageResult = (args.preGenerateImage ?? true) &&
    intent.imageRequested &&
    !deliveryGate.clarifyBeforeAction
    ? await (async () => {
        const startedAt = nowMs();
        const value = await maybeGenerateImageArtifact({
          ...args,
          currentPlanSlug,
          userSettingsMetadata,
          userMessage: args.userMessage,
          assistantReply: "",
          agentName: args.agentName,
          personaSummary: args.personaSummary,
          agentMetadata: args.agentMetadata ?? null,
          imageRequested: true,
          shouldUseRolePortraitReference: intent.shouldUseRolePortraitReference,
          rolePortraitReferenceStrength: intent.rolePortraitReferenceStrength,
        });
        imagePreGenerateDurationMs = elapsedMs(startedAt);
        return value;
      })()
    : null;

  return {
    intent,
    deliveryGate,
    currentPlanSlug,
    userSettingsMetadata,
    imageResult,
    audioTranscriptOverride: intent.audioRequested
      ? extractExplicitAudioContent(args.userMessage)
      : null,
    billingRetryEvents,
    timingMs: {
      total: elapsedMs(prepareStartedAt),
      detect_intent: detectIntentDurationMs,
      load_user_settings: userSettingsDurationMs,
      load_current_plan: currentPlanDurationMs,
      pre_generate_image: imagePreGenerateDurationMs
    }
  };
}

function pickAudioSource(args: {
  policy: UserAudioPolicy;
  assistantReply: string;
  imageRequested: boolean;
  audioRequested: boolean;
  recentAudioArtifactCount: number;
}) {
  if (args.audioRequested && args.policy.intentEnabled) {
    return {
      source: "intent" as const,
      reason: "user_requested_audio",
    };
  }

  const length = args.assistantReply.trim().length;
  if (!args.policy.ambientEnabled) {
    return {
      source: null,
      reason: "ambient_disabled",
    };
  }

  if (args.imageRequested) {
    return {
      source: null,
      reason: "image_already_requested",
    };
  }

  if (length < args.policy.ambientMinChars || length > args.policy.ambientMaxChars) {
    return {
      source: null,
      reason: "outside_length_window",
    };
  }

  if (args.recentAudioArtifactCount > 0) {
    return {
      source: null,
      reason: "cooldown_active",
    };
  }

  const normalized = args.assistantReply.toLowerCase();
  const expressiveCue =
    normalized.includes("miss you") ||
    normalized.includes("voice") ||
    normalized.includes("wish you were here") ||
    normalized.includes("想你") ||
    normalized.includes("抱抱") ||
    normalized.includes("晚安") ||
    normalized.includes("乖");
  const threshold = expressiveCue
    ? Math.min(args.policy.ambientProbability + 0.08, 0.35)
    : args.policy.ambientProbability;
  const seed = normalized
    .split("")
    .reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
  const deterministicRoll = (seed % 100) / 100;

  if (deterministicRoll < threshold) {
    return {
      source: "ambient_context" as const,
      reason: expressiveCue ? "expressive_context_match" : "ambient_probability_hit",
    };
  }

  return {
    source: null,
    reason: "ambient_probability_miss",
  };
}

async function maybeGenerateAudioArtifact(
  args: MessageTarget & {
    currentPlanSlug: string;
    userSettingsMetadata: Record<string, unknown>;
    assistantReply: string;
    imageRequested: boolean;
    audioRequested: boolean;
    audioTranscriptOverride?: string | null;
  }
) {
  const policy = getAudioPolicy(args.userSettingsMetadata);
  const recentMessages = await loadRecentAssistantMessages({
    ...args,
    limit: policy.ambientCooldownTurns,
  });
  const recentAudioArtifactCount = countRecentAudioArtifactMessages(recentMessages);
  const decision = pickAudioSource({
    policy,
    assistantReply: args.assistantReply,
    imageRequested: args.imageRequested,
    audioRequested: args.audioRequested,
    recentAudioArtifactCount,
  });

  const baseDecision = {
    mode: decision.source ? "generated" : "skipped",
    user_intent_detected: args.audioRequested,
    ambient_candidate:
      !args.audioRequested &&
      args.assistantReply.trim().length >= policy.ambientMinChars &&
      args.assistantReply.trim().length <= policy.ambientMaxChars,
    ambient_probability: policy.ambientProbability,
    ambient_cooldown_turns: policy.ambientCooldownTurns,
    recent_audio_artifact_count: recentAudioArtifactCount,
    decision_reason: decision.reason,
    selected_source: decision.source,
  };

  if (!decision.source) {
    return {
      artifact: null as AudioArtifactRecord | null,
      decision: {
        ...baseDecision,
        status: "not_generated",
      },
    };
  }

  const audioContext = await loadAudioSynthesisContext(args);
  if (!audioContext) {
    return {
      artifact: {
        id: buildArtifactRecordId("audio"),
        type: "audio",
        status: "failed",
        source: decision.source,
        modelSlug: "unconfigured",
        provider: "unconfigured",
        voiceName: null,
        contentType: null,
        url: null,
        transcript: "",
        createdAt: new Date().toISOString(),
        error: "No voice is bound to this role yet.",
        billing: buildInsufficientCreditsArtifactBilling(),
      } satisfies AudioArtifactRecord,
      decision: {
        ...baseDecision,
        status: "failed",
        error: "No voice is bound to this role yet.",
      },
    };
  }

  const transcript = truncateAudioTranscript(
    getString(args.audioTranscriptOverride) ?? args.assistantReply,
    policy.generationMaxChars
  );
  let billingResult: Awaited<ReturnType<typeof authorizeCapabilityConsumption>> | null = null;

  try {
    billingResult = await authorizeCapabilityConsumption({
      userId: args.userId,
      capabilityType: "audio",
      productModelSlug: audioContext.modelSlug,
      provider: audioContext.provider,
      reason: "chat_audio_generation",
      metadata: {
        assistant_message_id: args.assistantMessageId,
        thread_id: args.threadId,
        audio_source: decision.source,
      },
    });

    const audio = await synthesizeAudioForVoiceOption({
      text: transcript,
      provider: audioContext.provider,
      modelSlug: audioContext.modelSlug,
      voiceKey: audioContext.voiceKey,
      metadata: audioContext.metadata,
    });

    return {
      artifact: {
        id: buildArtifactRecordId("audio"),
        type: "audio",
        status: "ready",
        source: decision.source,
        modelSlug: audioContext.modelSlug,
        provider: audioContext.provider,
        voiceName: audioContext.voiceName,
        contentType: audio.contentType,
        url: toDataUrl(audio.contentType, audio.audioBuffer),
        transcript,
        createdAt: new Date().toISOString(),
        billing: mapBillingResultToArtifactBilling(billingResult),
      } satisfies AudioArtifactRecord,
      decision: {
        ...baseDecision,
        status: "generated",
        provider: audioContext.provider,
        model_slug: audioContext.modelSlug,
        voice_name: audioContext.voiceName,
        transcript_length: transcript.length,
      },
    };
  } catch (error) {
    if (
      billingResult &&
      (billingResult.debitedCredits > 0 || billingResult.allowanceConsumed > 0)
    ) {
      await refundCapabilityConsumption({
        userId: args.userId,
        capabilityType: "audio",
        productModelSlug: audioContext.modelSlug,
        provider: audioContext.provider,
        amount: billingResult.debitedCredits,
        allowanceUnits: billingResult.allowanceConsumed,
        metricKey: billingResult.metricKey,
        usagePeriodStart: billingResult.usagePeriodStart,
        usagePeriodEnd: billingResult.usagePeriodEnd,
        reason: "chat_audio_generation_refund",
        metadata: {
          assistant_message_id: args.assistantMessageId,
          thread_id: args.threadId,
          reason: "artifact_generation_failed",
          audio_source: decision.source,
        },
      });
    }

    const message = error instanceof Error ? error.message : "Audio generation failed.";
    return {
      artifact: {
        id: buildArtifactRecordId("audio"),
        type: "audio",
        status: "failed",
        source: decision.source,
        modelSlug: audioContext.modelSlug,
        provider: audioContext.provider,
        voiceName: audioContext.voiceName,
        contentType: null,
        url: null,
        transcript,
        createdAt: new Date().toISOString(),
        error: message,
        billing: buildInsufficientCreditsArtifactBilling(),
      } satisfies AudioArtifactRecord,
      decision: {
        ...baseDecision,
        status: "failed",
        error: message,
      },
    };
  }
}

export async function maybeGenerateAssistantArtifacts(
  args: MessageTarget & {
    userMessage: string;
    assistantReply: string;
    agentName: string | null;
    personaSummary: string;
    agentMetadata?: Record<string, unknown> | null;
    preparedContext: PreparedExplicitArtifactContext;
    audioTranscriptOverride?: string | null;
  }
) {
  const preparedContext = args.preparedContext;
  const userSettingsMetadata = preparedContext.userSettingsMetadata;
  const currentPlanSlug = preparedContext.currentPlanSlug;
  const intent = preparedContext.intent;
  const currentAssistantMetadata = await loadCurrentAssistantMetadata(args);
  const gateClarifyBeforeAction =
    preparedContext.deliveryGate?.clarifyBeforeAction === true;
  const imageResult =
    preparedContext.imageResult ??
    (await maybeGenerateImageArtifact({
      ...args,
      currentPlanSlug,
      userSettingsMetadata,
      userMessage: args.userMessage,
      assistantReply: args.assistantReply,
      agentName: args.agentName,
      personaSummary: args.personaSummary,
      agentMetadata: args.agentMetadata ?? null,
      imageRequested: intent.imageRequested && !gateClarifyBeforeAction,
      shouldUseRolePortraitReference:
        intent.shouldUseRolePortraitReference && !gateClarifyBeforeAction,
      rolePortraitReferenceStrength: intent.rolePortraitReferenceStrength,
    }));

  if (imageResult.artifact) {
    await updateAssistantMultimodalMetadata({
      ...args,
      multimodal: {
        image: {
          user_intent_detected: intent.imageRequested,
          source: "intent",
          status: imageResult.status,
          model_slug: imageResult.artifact.modelSlug,
          error: imageResult.artifact.error ?? null,
          role_portrait_reference_used:
            imageResult.artifact.referenceSource === "role_portrait",
          role_portrait_reference_strength: imageResult.artifact.referenceStrength,
          intent_source: intent.source,
          intent_confidence: intent.imageConfidence,
          intent_reasoning: gateClarifyBeforeAction
            ? preparedContext.deliveryGate?.reason ?? intent.reasoning
            : intent.reasoning,
        },
        audio:
          asRecord(currentAssistantMetadata.multimodal).audio ??
          {
            mode: "pending",
          },
      },
      artifact: imageResult.artifact,
    });
  }

  const audioResult = await maybeGenerateAudioArtifact({
    ...args,
    currentPlanSlug,
    userSettingsMetadata,
    assistantReply: args.assistantReply,
    imageRequested: intent.imageRequested,
    audioRequested: intent.audioRequested,
      audioTranscriptOverride:
        getString(args.audioTranscriptOverride) ??
      preparedContext.audioTranscriptOverride ??
      null,
  });

  await updateAssistantMultimodalMetadata({
    ...args,
    multimodal: {
      image: {
        user_intent_detected: intent.imageRequested,
        source: "intent",
        status: imageResult.status,
        model_slug: imageResult.artifact?.modelSlug ?? null,
        error: imageResult.artifact?.error ?? null,
        role_portrait_reference_used:
          imageResult.artifact?.referenceSource === "role_portrait",
        role_portrait_reference_strength:
          imageResult.artifact?.referenceStrength ?? intent.rolePortraitReferenceStrength,
        intent_source: intent.source,
        intent_confidence: intent.imageConfidence,
        intent_reasoning: gateClarifyBeforeAction
          ? preparedContext.deliveryGate?.reason ?? intent.reasoning
          : intent.reasoning,
      },
      audio: {
        ...audioResult.decision,
        intent_source: intent.source,
        intent_confidence: intent.audioConfidence,
        intent_reasoning: intent.reasoning,
      },
    },
    artifact: audioResult.artifact,
  });

  return {
    image: imageResult,
    audio: audioResult,
  };
}
