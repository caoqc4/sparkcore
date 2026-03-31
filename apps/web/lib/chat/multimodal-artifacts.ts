import { synthesizeAudioForVoiceOption } from "@/lib/audio/synthesis";
import { loadScopedMessageById } from "@/lib/chat/message-read";
import { updateScopedMessage } from "@/lib/chat/message-persistence";
import { generateImage, generateText } from "@/lib/litellm/client";
import {
  CapabilityBillingError,
  authorizeCapabilityConsumption,
  refundCapabilityConsumption,
} from "@/lib/product/capability-billing";
import { getProductModelCatalogItemBySlug } from "@/lib/product/model-catalog";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import {
  loadActiveAudioAssetById,
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

type UserAudioPolicy = {
  intentEnabled: boolean;
  ambientEnabled: boolean;
  ambientProbability: number;
  ambientCooldownTurns: number;
  ambientMinChars: number;
  ambientMaxChars: number;
  generationMaxChars: number;
};

export type MultimodalIntentDecision = {
  imageRequested: boolean;
  audioRequested: boolean;
  imageConfidence: number;
  audioConfidence: number;
  source: "rules" | "classifier" | "fallback_rules";
  reasoning: string | null;
};

export type PreparedExplicitArtifactContext = {
  intent: MultimodalIntentDecision;
  currentPlanSlug: string;
  userSettingsMetadata: Record<string, unknown>;
  imageResult: Awaited<ReturnType<typeof maybeGenerateImageArtifact>> | null;
  audioTranscriptOverride: string | null;
};

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

function buildImageIntentPatterns() {
  return [
    /生成(一张|一个|些)?图/,
    /生成[\s\S]{0,24}(图|图片|照片|相片)/,
    /来张图/,
    /发(我)?一张图/,
    /发(我)?[\s\S]{0,24}(图|图片|照片|相片)/,
    /给我[\s\S]{0,24}(图|图片|照片|相片)/,
    /画(一张|个)?/,
    /做(一张|个)?(图片|头像)/,
    /看(看)?(图|图片)/,
    /照片/,
    /相片/,
    /\b(generate|make|create|draw|send)\b[\s\S]{0,24}\b(image|picture|photo|portrait|avatar)\b/i,
    /\bimage\b[\s\S]{0,24}\bplease\b/i,
  ];
}

function parseClassifierJson(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Classifier returned non-JSON content.");
    }

    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  }
}

function buildAudioIntentPatterns() {
  return [
    /语音回/,
    /发(我)?语音/,
    /用语音/,
    /语音说/,
    /语音讲/,
    /语音念/,
    /说一下/,
    /说一[下声]*/,
    /念一下/,
    /读一下/,
    /读给我/,
    /讲给我/,
    /听听你的声音/,
    /你的声音/,
    /语音消息/,
    /\bvoice\b[\s\S]{0,16}\b(reply|message|note)\b/i,
    /\baudio\b[\s\S]{0,16}\b(reply|message|note)\b/i,
  ];
}

export function extractExplicitAudioContent(content: string): string | null {
  const normalized = content.trim();
  if (!normalized) {
    return null;
  }

  const hasAudioCue = buildAudioIntentPatterns().some((pattern) => pattern.test(normalized));
  if (!hasAudioCue) {
    return null;
  }

  const quotedMatches = Array.from(
    normalized.matchAll(/[“"「『](.+?)[”"」』]/g)
  );
  const lastQuoted = quotedMatches.at(-1)?.[1]?.trim() ?? null;
  if (lastQuoted && lastQuoted.length > 0) {
    return lastQuoted;
  }

  const colonMatch = normalized.match(
    /(?:用语音(?:回(?:我)?|说|讲|念|读)?|语音(?:回(?:我)?|说|讲|念|读)?|说一下|说一声|念一下|读一下|读给我听|讲给我听)[：:]\s*([\s\S]+)/
  );
  if (colonMatch?.[1]) {
    const extracted = colonMatch[1].trim();
    return extracted.length > 0 ? extracted : null;
  }

  const conversationalMatch = normalized.match(
    /(?:你能|可以|麻烦你|请你)?(?:用语音|语音)?(?:说|讲|念|读)(?:一下|一声)?[，,\s]*([^。！？!?]{1,80}?)(?:吗|呢|吧|呀|啊)?[。！？!?]?$/
  );
  if (conversationalMatch?.[1]) {
    const extracted = conversationalMatch[1]
      .trim()
      .replace(/^[“"「『]|[”"」』]$/g, "")
      .trim();
    return extracted.length > 0 ? extracted : null;
  }

  return null;
}

export function detectMultimodalIntentByRules(content: string) {
  const normalized = content.trim();
  const imageRequested = buildImageIntentPatterns().some((pattern) => pattern.test(normalized));
  const audioRequested = buildAudioIntentPatterns().some((pattern) => pattern.test(normalized));

  return {
    imageRequested,
    audioRequested,
  };
}

export async function detectMultimodalIntent(content: string): Promise<MultimodalIntentDecision> {
  const ruleDecision = detectMultimodalIntentByRules(content);
  if (ruleDecision.imageRequested || ruleDecision.audioRequested) {
    return {
      ...ruleDecision,
      imageConfidence: ruleDecision.imageRequested ? 0.98 : 0.02,
      audioConfidence: ruleDecision.audioRequested ? 0.98 : 0.02,
      source: "rules",
      reasoning: "Matched high-confidence multimodal intent rules."
    };
  }

  try {
    const result = await generateText({
      model: "replicate-gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            "You classify whether a user is explicitly asking the assistant to generate an image and/or reply with audio.",
            "Return strict JSON only.",
            "Be conservative about triggering generation.",
            "image_requested should be true only when the user clearly wants a picture, photo, illustration, avatar, visual, or generated image.",
            "audio_requested should be true only when the user clearly wants a voice note, spoken reply, or audio message.",
            "Words like 图片, 图, 照片, 相片, 配图, 发我看看, visual, image, photo, picture may indicate image intent depending on context.",
            "Words like 语音, 音频, 念给我听, 读出来, voice reply, audio reply may indicate audio intent depending on context."
          ].join("\n")
        },
        {
          role: "user",
          content: [
            "Classify this message.",
            `Message: ${content.trim()}`,
            'JSON schema: {"image_requested": boolean, "audio_requested": boolean, "image_confidence": number, "audio_confidence": number, "reasoning": string}'
          ].join("\n")
        }
      ],
      temperature: 0,
      maxOutputTokens: 180,
      timeoutMs: 18_000
    });

    const parsed = parseClassifierJson(result.content);
    const imageConfidence = clamp(getNumber(parsed.image_confidence) ?? 0, 0, 1);
    const audioConfidence = clamp(getNumber(parsed.audio_confidence) ?? 0, 0, 1);
    const classifierDecision = {
      imageRequested:
        parsed.image_requested === true && imageConfidence >= 0.7,
      audioRequested:
        parsed.audio_requested === true && audioConfidence >= 0.7,
      imageConfidence,
      audioConfidence,
      source: "classifier" as const,
      reasoning: getString(parsed.reasoning)
    };

    return classifierDecision;
  } catch {
    return {
      ...ruleDecision,
      imageConfidence: ruleDecision.imageRequested ? 0.85 : 0.05,
      audioConfidence: ruleDecision.audioRequested ? 0.85 : 0.05,
      source: "fallback_rules",
      reasoning: "Classifier unavailable, falling back to rules."
    };
  }
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
}) {
  const wantsPhotoStyle = isPhotoStyleRequest(args.userMessage);
  const personaLine =
    args.personaSummary.trim().length > 0
      ? `Role essence to preserve lightly: ${args.personaSummary.trim()}.`
      : "";

  if (wantsPhotoStyle) {
    return [
      "Create a realistic photographic image that satisfies the user's request.",
      "Prioritize the requested scene or subject over symbolic companion art.",
      args.agentName
        ? `If a human subject appears, keep only a subtle visual echo of ${args.agentName}; do not force a character portrait unless the user explicitly asked for a person.`
        : "",
      personaLine,
      `User request: ${args.userMessage.trim()}`,
      "Style target: believable photo, natural lighting, camera-like detail, grounded composition, not an illustration.",
      "If the request is for a place or scene, focus on the environment first.",
      "Keep the image tasteful, emotionally warm, and safe for a general audience.",
      "No text overlays unless the user explicitly asked for text in the image.",
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }

  const roleLine = args.agentName
    ? `Character inspiration: ${args.agentName}.`
    : "Character inspiration: the current SparkCore companion.";

  return [
    "Create a polished conversational companion image that satisfies the user's request.",
    roleLine,
    personaLine,
    `User request: ${args.userMessage.trim()}`,
    args.assistantReply?.trim()
      ? `Reply context: ${args.assistantReply.trim()}`
      : "",
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
    imageRequested: boolean;
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
    getProductModelCatalogItemBySlug("image-nano-banana");

  if (!imageModel?.litellmModelName) {
    return {
      artifact: {
        id: `img_${Date.now()}`,
        type: "image",
        status: "failed",
        source: "intent",
        modelSlug: selectedImageModelSlug ?? "image-nano-banana",
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

  const prompt = buildImagePrompt({
    userMessage: args.userMessage,
    assistantReply: args.assistantReply,
    agentName: args.agentName,
    personaSummary: args.personaSummary,
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
      model: imageModel.litellmModelName,
      replicateModelRef: imageModel.replicateModelRef,
      prompt,
      n: 1,
      size: "1024x1024",
    });

    return {
      artifact: {
        id: `img_${Date.now()}`,
        type: "image",
        status: "ready",
        source: "intent",
        modelSlug: imageModel.slug,
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
        id: `img_${Date.now()}`,
        type: "image",
        status: "failed",
        source: "intent",
        modelSlug: imageModel.slug,
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
  }
): Promise<PreparedExplicitArtifactContext> {
  const [userSettingsMetadata, currentPlanSlug, intent] = await Promise.all([
    loadUserSettingsMetadata({
      supabase: args.supabase,
      userId: args.userId,
    }),
    loadCurrentProductPlanSlug({
      supabase: args.supabase,
      userId: args.userId,
    }),
    detectMultimodalIntent(args.userMessage),
  ]);

  const imageResult = intent.imageRequested
    ? await maybeGenerateImageArtifact({
        ...args,
        currentPlanSlug,
        userSettingsMetadata,
        userMessage: args.userMessage,
        assistantReply: "",
        agentName: args.agentName,
        personaSummary: args.personaSummary,
        imageRequested: true,
      })
    : null;

  return {
    intent,
    currentPlanSlug,
    userSettingsMetadata,
    imageResult,
    audioTranscriptOverride: intent.audioRequested
      ? extractExplicitAudioContent(args.userMessage)
      : null,
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
        id: `audio_${Date.now()}`,
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
        id: `audio_${Date.now()}`,
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
        id: `audio_${Date.now()}`,
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
    preparedContext?: PreparedExplicitArtifactContext | null;
    audioTranscriptOverride?: string | null;
  }
) {
  const preparedContext = args.preparedContext ?? null;
  const [userSettingsMetadata, currentPlanSlug, intent] = await Promise.all([
    preparedContext?.userSettingsMetadata
      ? Promise.resolve(preparedContext.userSettingsMetadata)
      : loadUserSettingsMetadata({
          supabase: args.supabase,
          userId: args.userId,
        }),
    preparedContext?.currentPlanSlug
      ? Promise.resolve(preparedContext.currentPlanSlug)
      : loadCurrentProductPlanSlug({
          supabase: args.supabase,
          userId: args.userId,
        }),
    preparedContext?.intent
      ? Promise.resolve(preparedContext.intent)
      : detectMultimodalIntent(args.userMessage),
  ]);
  const currentAssistantMetadata = await loadCurrentAssistantMetadata(args);
  const imageResult =
    preparedContext?.imageResult ??
    (await maybeGenerateImageArtifact({
      ...args,
      currentPlanSlug,
      userSettingsMetadata,
      userMessage: args.userMessage,
      assistantReply: args.assistantReply,
      agentName: args.agentName,
      personaSummary: args.personaSummary,
      imageRequested: intent.imageRequested,
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
          intent_source: intent.source,
          intent_confidence: intent.imageConfidence,
          intent_reasoning: intent.reasoning,
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
      preparedContext?.audioTranscriptOverride ??
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
        intent_source: intent.source,
        intent_confidence: intent.imageConfidence,
        intent_reasoning: intent.reasoning,
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
