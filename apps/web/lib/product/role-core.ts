import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";

export type ProductRoleMode = "companion" | "girlfriend" | "boyfriend";
export type ProductRoleTone = "warm" | "playful" | "steady";
export type ProductRoleProactivity = "low" | "balanced" | "active";
export type ProductRoleAvatarStyle = "realistic" | "anime" | "illustrated";
export type ProductRoleAvatarGender = "female" | "male" | "neutral";
export type ProductRoleAvatarOrigin = "preset" | "upload" | "generated";

export type ProductRoleCoreConfig = {
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
  boundaries: string;
  proactivityLevel: ProductRoleProactivity;
};

type UnknownRecord = Record<string, unknown>;

type ProductRoleAppearanceConfig = {
  avatarPresetId: string;
  avatarStyle: ProductRoleAvatarStyle | null;
  avatarGender: ProductRoleAvatarGender | null;
  avatarOrigin: ProductRoleAvatarOrigin | null;
};

export type ProductRoleAppearanceSummary = {
  avatarPresetId: string | null;
  avatarStyle: ProductRoleAvatarStyle | null;
  avatarGender: ProductRoleAvatarGender | null;
  avatarOrigin: ProductRoleAvatarOrigin | null;
};

export function trimProductText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function safeProductRoleMode(value: string): ProductRoleMode {
  if (value === "girlfriend" || value === "boyfriend") {
    return value;
  }

  return "companion";
}

export function safeProductRoleTone(value: string): ProductRoleTone {
  if (value === "playful" || value === "steady") {
    return value;
  }

  return "warm";
}

export function safeProductRoleProactivity(value: string): ProductRoleProactivity {
  if (value === "low" || value === "active") {
    return value;
  }

  return "balanced";
}

export function safeProductRoleAvatarStyle(value: string): ProductRoleAvatarStyle | null {
  if (value === "realistic" || value === "anime" || value === "illustrated") {
    return value;
  }

  return null;
}

export function safeProductRoleAvatarGender(value: string): ProductRoleAvatarGender | null {
  if (value === "female" || value === "male" || value === "neutral") {
    return value;
  }

  return null;
}

export function safeProductRoleAvatarOrigin(value: string): ProductRoleAvatarOrigin | null {
  if (value === "preset" || value === "upload" || value === "generated") {
    return value;
  }

  return null;
}

function getProductRoleCoreRecord(metadata: unknown): UnknownRecord {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const record = (metadata as UnknownRecord).product_role_core;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return {};
  }

  return record as UnknownRecord;
}

function getProductRoleAppearanceRecord(metadata: unknown): UnknownRecord {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const record = (metadata as UnknownRecord).product_role_appearance;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return {};
  }

  return record as UnknownRecord;
}

function resolveProductRoleAppearance(args: {
  existingMetadata?: UnknownRecord | null;
  avatarPresetId?: string | null;
  avatarStyle?: ProductRoleAvatarStyle | null;
  avatarGender?: ProductRoleAvatarGender | null;
  avatarOrigin?: ProductRoleAvatarOrigin | null;
}): ProductRoleAppearanceConfig | null {
  const existing = getProductRoleAppearanceRecord(args.existingMetadata);

  const avatarPresetId =
    trimProductText(args.avatarPresetId) || trimProductText(existing.avatar_preset_id);
  const avatarStyle =
    args.avatarStyle ??
    safeProductRoleAvatarStyle(trimProductText(existing.avatar_style));
  const avatarGender =
    args.avatarGender ??
    safeProductRoleAvatarGender(trimProductText(existing.avatar_gender));
  const avatarOrigin =
    args.avatarOrigin ??
    safeProductRoleAvatarOrigin(trimProductText(existing.avatar_origin));

  if (!avatarPresetId && !avatarStyle && !avatarGender && !avatarOrigin) {
    return null;
  }

  return {
    avatarPresetId,
    avatarStyle,
    avatarGender,
    avatarOrigin
  };
}

export function resolveStoredProductRoleAppearance(
  metadata: unknown
): ProductRoleAppearanceSummary {
  const appearance = getProductRoleAppearanceRecord(metadata);
  const avatarPresetId = trimProductText(appearance.avatar_preset_id) || null;

  return {
    avatarPresetId,
    avatarStyle: safeProductRoleAvatarStyle(trimProductText(appearance.avatar_style)),
    avatarGender: safeProductRoleAvatarGender(trimProductText(appearance.avatar_gender)),
    avatarOrigin: safeProductRoleAvatarOrigin(trimProductText(appearance.avatar_origin))
  };
}

function parseRelationshipModeFromSystemPrompt(systemPrompt: string | null | undefined) {
  if (!systemPrompt) {
    return "";
  }

  const match = systemPrompt.match(/Relationship mode:\s*([^.]*)/i);
  return match?.[1]?.trim() ?? "";
}

function parseBoundariesFromSystemPrompt(systemPrompt: string | null | undefined) {
  if (!systemPrompt) {
    return "";
  }

  const match = systemPrompt.match(/Respect these boundaries:\s*(.*?)\s*Prioritize continuity/i);
  return match?.[1]?.trim() ?? "";
}

function detectModeFromMetadata(metadata: unknown): ProductRoleMode {
  const productRoleCore = getProductRoleCoreRecord(metadata);
  if (typeof productRoleCore.mode === "string") {
    return safeProductRoleMode(productRoleCore.mode);
  }

  if (
    metadata &&
    typeof metadata === "object" &&
    typeof (metadata as UnknownRecord).source_slug === "string" &&
    ((metadata as UnknownRecord).source_slug === "product_girlfriend" ||
      (metadata as UnknownRecord).source_slug === "product_boyfriend")
  ) {
    return (metadata as UnknownRecord).source_slug === "product_boyfriend"
      ? "boyfriend"
      : "girlfriend";
  }

  return "companion";
}

function detectTone(args: {
  metadata: unknown;
  stylePrompt?: string | null;
}): ProductRoleTone {
  const productRoleCore = getProductRoleCoreRecord(args.metadata);
  if (typeof productRoleCore.tone === "string") {
    return safeProductRoleTone(productRoleCore.tone);
  }

  const prompt = args.stylePrompt ?? "";
  if (prompt.includes("Playful") || prompt.includes("light, lively")) {
    return "playful";
  }

  if (prompt.includes("grounded") || prompt.includes("calm")) {
    return "steady";
  }

  return "warm";
}

export function resolveProductRoleCore(args: {
  metadata: unknown;
  stylePrompt?: string | null;
  systemPrompt?: string | null;
}): ProductRoleCoreConfig {
  const productRoleCore = getProductRoleCoreRecord(args.metadata);

  return {
    mode: detectModeFromMetadata(args.metadata),
    tone: detectTone({
      metadata: args.metadata,
      stylePrompt: args.stylePrompt
    }),
    relationshipMode:
      trimProductText(productRoleCore.relationship_mode) ||
      parseRelationshipModeFromSystemPrompt(args.systemPrompt) ||
      "long-term companion",
    boundaries:
      trimProductText(productRoleCore.boundaries) ||
      parseBoundariesFromSystemPrompt(args.systemPrompt) ||
      "Be supportive, respectful, and avoid manipulative or coercive behavior.",
    proactivityLevel: safeProductRoleProactivity(
      trimProductText(productRoleCore.proactivity_level) || "balanced"
    )
  };
}

export function buildProductPersonaSummary(args: {
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
}) {
  const modeCopy =
    args.mode === "girlfriend"
      ? "Relationship-first, emotionally continuous, and attentive."
      : args.mode === "boyfriend"
        ? "Relationship-first, grounded, emotionally available, and consistent."
      : "Companion-first, steady, and supportive over time.";
  const toneCopy =
    args.tone === "playful"
      ? "Playful and light in delivery."
      : args.tone === "steady"
        ? "Grounded and calm in delivery."
        : "Warm and caring in delivery.";

  return `${modeCopy} ${toneCopy} Relationship mode: ${args.relationshipMode}.`;
}

export function buildProductStylePrompt(tone: ProductRoleTone) {
  if (tone === "playful") {
    return "Use light, lively phrasing. Stay emotionally present without becoming noisy or flippant.";
  }

  if (tone === "steady") {
    return "Use calm, grounded language. Stay concise, dependable, and emotionally steady.";
  }

  return "Use warm, reassuring language. Stay gentle, natural, and relationship-aware.";
}

function buildProactivityCopy(level: ProductRoleProactivity) {
  if (level === "active") {
    return "Take initiative when it helps sustain continuity, but stay welcome and non-pushy.";
  }

  if (level === "low") {
    return "Stay mostly responsive and avoid over-initiating unless the user clearly invites it.";
  }

  return "Be gently proactive when it improves continuity, while staying respectful of the user's pace.";
}

export function buildProductSystemPrompt(args: {
  name: string;
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
  boundaries: string;
  proactivityLevel: ProductRoleProactivity;
  userPreferredName?: string | null;
}) {
  const parts = [
    `You are ${args.name}, a SparkCore long-memory ${args.mode}.`,
    `Your tone should be ${args.tone}.`,
    `Relationship mode: ${args.relationshipMode}.`,
    args.userPreferredName
      ? `The user prefers to be called "${args.userPreferredName}" — always address them by this name.`
      : null,
    `Respect these boundaries: ${args.boundaries}.`,
    `Proactivity: ${buildProactivityCopy(args.proactivityLevel)}`,
    "Prioritize continuity, warmth, and a sense of being the same companion over time.",
    "Do not drift into generic assistant-mode unless the user clearly needs practical help."
  ];
  return parts.filter(Boolean).join(" ");
}

export function buildProductAgentMetadata(args: {
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
  boundaries: string;
  proactivityLevel: ProductRoleProactivity;
  userPreferredName?: string | null;
  avatarPresetId?: string | null;
  avatarStyle?: ProductRoleAvatarStyle | null;
  avatarGender?: ProductRoleAvatarGender | null;
  avatarOrigin?: ProductRoleAvatarOrigin | null;
  existingMetadata?: UnknownRecord | null;
}) {
  const appearance = resolveProductRoleAppearance({
    existingMetadata: args.existingMetadata,
    avatarPresetId: args.avatarPresetId,
    avatarStyle: args.avatarStyle,
    avatarGender: args.avatarGender,
    avatarOrigin: args.avatarOrigin
  });

  return {
    ...(args.existingMetadata ?? {}),
    ...buildAgentSourceMetadata({
      createdFromChat: false,
      sourceSlug: `product_${args.mode}`,
      sourceDescription: "Created from product-layer companion setup"
    }),
    product_role_core: {
      mode: args.mode,
      tone: args.tone,
      relationship_mode: args.relationshipMode,
      boundaries: args.boundaries,
      proactivity_level: args.proactivityLevel,
      ...(args.userPreferredName ? { user_preferred_name: args.userPreferredName } : {})
    },
    ...(appearance
      ? {
          product_role_appearance: {
            avatar_preset_id: appearance.avatarPresetId,
            avatar_style: appearance.avatarStyle,
            avatar_gender: appearance.avatarGender,
            avatar_origin: appearance.avatarOrigin
          }
        }
      : {})
  };
}
