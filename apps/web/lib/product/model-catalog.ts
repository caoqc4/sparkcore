export type ProductModelCatalogCapability = "text" | "image" | "audio";
export type ProductModelCatalogTier = "free" | "pro";
export type ProductModelIntegrationMode = "replicate" | "official";
export type ProductModelUiStatus = "active" | "planned";

export type ProductModelCatalogItem = {
  slug: string;
  capability: ProductModelCatalogCapability;
  displayName: string;
  provider: string;
  tier: ProductModelCatalogTier;
  isDefault: boolean;
  tags: string[];
  integrationMode: ProductModelIntegrationMode;
  uiStatus: ProductModelUiStatus;
  litellmModelName?: string;
  replicateModelRef?: string;
  runtimeProfileSlug?: string;
  statusLabel?: string;
};

export const PRODUCT_MODEL_CATALOG: ProductModelCatalogItem[] = [
  {
    slug: "text-gpt-4o-mini",
    capability: "text",
    displayName: "OpenAI GPT-4o mini",
    provider: "OpenAI",
    tier: "free",
    isDefault: true,
    tags: ["Fast", "Low cost"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-gpt-4o-mini",
    replicateModelRef: "replicate/openai/gpt-4o-mini",
    runtimeProfileSlug: "text-core-lite",
    statusLabel: "Available now"
  },
  {
    slug: "text-claude-sonnet-4",
    capability: "text",
    displayName: "Anthropic Claude Sonnet 4",
    provider: "Anthropic",
    tier: "pro",
    isDefault: true,
    tags: ["Natural companion", "Reasoning"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-claude-4-sonnet",
    replicateModelRef: "replicate/anthropic/claude-4-sonnet",
    runtimeProfileSlug: "text-reasoning-pro",
    statusLabel: "Available now"
  },
  {
    slug: "text-gpt-4-1",
    capability: "text",
    displayName: "OpenAI GPT-4.1",
    provider: "OpenAI",
    tier: "pro",
    isDefault: false,
    tags: ["Reliable", "Balanced quality"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-gpt-4.1",
    replicateModelRef: "replicate/openai/gpt-4.1",
    runtimeProfileSlug: "text-gpt-4-1",
    statusLabel: "Available now"
  },
  {
    slug: "text-gemini-2-5-pro",
    capability: "text",
    displayName: "Google Gemini 2.5 Pro",
    provider: "Google",
    tier: "pro",
    isDefault: false,
    tags: ["Deep reasoning", "Premium quality"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "text-gemini-2-5-flash",
    capability: "text",
    displayName: "Google Gemini 2.5 Flash",
    provider: "Google",
    tier: "free",
    isDefault: false,
    tags: ["Fast", "Low cost"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "text-deepseek-chat",
    capability: "text",
    displayName: "DeepSeek Chat",
    provider: "DeepSeek",
    tier: "free",
    isDefault: false,
    tags: ["Chinese-friendly", "Low cost"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "text-deepseek-reasoner",
    capability: "text",
    displayName: "DeepSeek Reasoner",
    provider: "DeepSeek",
    tier: "pro",
    isDefault: false,
    tags: ["Reasoning", "Chinese-friendly"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "text-llama-3-8b",
    capability: "text",
    displayName: "Meta Llama 3 8B",
    provider: "Meta",
    tier: "free",
    isDefault: false,
    tags: ["Fast", "Low cost"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-llama-3-8b",
    replicateModelRef: "replicate/meta/meta-llama-3-8b-instruct",
    runtimeProfileSlug: "text-creative-lite",
    statusLabel: "Available now"
  },
  {
    slug: "image-nano-banana",
    capability: "image",
    displayName: "Google Nano Banana",
    provider: "Google",
    tier: "free",
    isDefault: true,
    tags: ["Fast", "Everyday use"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-nano-banana",
    replicateModelRef: "replicate/google/nano-banana",
    statusLabel: "Available now"
  },
  {
    slug: "image-nano-banana-pro",
    capability: "image",
    displayName: "Google Nano Banana Pro",
    provider: "Google",
    tier: "pro",
    isDefault: true,
    tags: ["Portrait quality", "Premium"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-nano-banana-pro",
    replicateModelRef: "replicate/google/nano-banana-pro",
    statusLabel: "Available now"
  },
  {
    slug: "image-flux-2-pro",
    capability: "image",
    displayName: "FLUX.2 Pro",
    provider: "Black Forest Labs",
    tier: "free",
    isDefault: false,
    tags: ["High quality", "Photorealistic"],
    integrationMode: "replicate",
    uiStatus: "active",
    litellmModelName: "replicate-flux-2-pro",
    replicateModelRef: "replicate/black-forest-labs/flux-2-pro",
    statusLabel: "Available now"
  },
  {
    slug: "image-flux-2-flex",
    capability: "image",
    displayName: "FLUX.2 Flex",
    provider: "Black Forest Labs",
    tier: "pro",
    isDefault: false,
    tags: ["Style control", "Consistent"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "image-ideogram-3",
    capability: "image",
    displayName: "Ideogram 3.0",
    provider: "Ideogram",
    tier: "pro",
    isDefault: false,
    tags: ["Text in image", "Design-focused"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "image-recraft-v4-pro",
    capability: "image",
    displayName: "Recraft V4 Pro",
    provider: "Recraft",
    tier: "pro",
    isDefault: false,
    tags: ["Design-focused", "Brand visual"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-elevenlabs-v3",
    capability: "audio",
    displayName: "ElevenLabs Eleven v3",
    provider: "ElevenLabs",
    tier: "pro",
    isDefault: true,
    tags: ["Human-like voice", "Expressive voice"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-elevenlabs-multilingual-v2",
    capability: "audio",
    displayName: "ElevenLabs Multilingual v2",
    provider: "ElevenLabs",
    tier: "pro",
    isDefault: false,
    tags: ["Natural voice", "Multilingual"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-gemini-2-5-flash-tts",
    capability: "audio",
    displayName: "Google Gemini 2.5 Flash TTS",
    provider: "Google",
    tier: "free",
    isDefault: false,
    tags: ["Fast", "Expressive voice"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-gemini-2-5-pro-tts",
    capability: "audio",
    displayName: "Google Gemini 2.5 Pro TTS",
    provider: "Google",
    tier: "pro",
    isDefault: false,
    tags: ["Expressive voice", "Premium"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-minimax-speech",
    capability: "audio",
    displayName: "MiniMax Speech",
    provider: "MiniMax",
    tier: "free",
    isDefault: true,
    tags: ["Chinese-friendly", "Fast"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-aws-polly-neural",
    capability: "audio",
    displayName: "AWS Polly Neural",
    provider: "AWS",
    tier: "free",
    isDefault: false,
    tags: ["Reliable", "Low cost"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  },
  {
    slug: "audio-aws-polly-generative",
    capability: "audio",
    displayName: "AWS Polly Generative",
    provider: "AWS",
    tier: "pro",
    isDefault: false,
    tags: ["Reliable", "Premium"],
    integrationMode: "official",
    uiStatus: "planned",
    statusLabel: "Official integration planned"
  }
];

export function getProductModelCatalogByCapability(capability: ProductModelCatalogCapability) {
  return PRODUCT_MODEL_CATALOG.filter((item) => item.capability === capability);
}

export function getProductModelCatalogItemBySlug(slug: string | null | undefined) {
  if (!slug) {
    return null;
  }

  return PRODUCT_MODEL_CATALOG.find((item) => item.slug === slug) ?? null;
}
