import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";

export type ProductRoleMode = "companion" | "girlfriend" | "boyfriend";
export type ProductRoleTone = "warm" | "playful" | "steady";
export type ProductRoleProactivity = "low" | "balanced" | "active";

export type ProductRoleCoreConfig = {
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
  boundaries: string;
  proactivityLevel: ProductRoleProactivity;
};

type UnknownRecord = Record<string, unknown>;

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
}) {
  return [
    `You are ${args.name}, a SparkCore long-memory ${args.mode}.`,
    `Your tone should be ${args.tone}.`,
    `Relationship mode: ${args.relationshipMode}.`,
    `Respect these boundaries: ${args.boundaries}.`,
    `Proactivity: ${buildProactivityCopy(args.proactivityLevel)}`,
    "Prioritize continuity, warmth, and a sense of being the same companion over time.",
    "Do not drift into generic assistant-mode unless the user clearly needs practical help."
  ].join(" ");
}

export function buildProductAgentMetadata(args: {
  mode: ProductRoleMode;
  tone: ProductRoleTone;
  relationshipMode: string;
  boundaries: string;
  proactivityLevel: ProductRoleProactivity;
  existingMetadata?: UnknownRecord | null;
}) {
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
      proactivity_level: args.proactivityLevel
    }
  };
}
