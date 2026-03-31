import { synthesizeAzureSpeechPreview } from "@/lib/audio/azure-speech";
import { synthesizeElevenLabsSpeech } from "@/lib/audio/elevenlabs";

export function asMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

export function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function inferTextLocale(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  const chineseMatches = normalized.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinMatches = normalized.match(/[A-Za-z]/g)?.length ?? 0;

  if (chineseMatches >= 4 && chineseMatches >= latinMatches) {
    return "zh-CN";
  }

  return null;
}

function resolveAzureVoice(args: {
  text: string;
  configuredLocale: string | null;
  configuredVoiceName: string;
}) {
  const inferredLocale = inferTextLocale(args.text);
  if (inferredLocale !== "zh-CN") {
    return {
      locale: args.configuredLocale ?? "en-US",
      voiceName: args.configuredVoiceName,
    };
  }

  const configuredLocale = args.configuredLocale ?? "en-US";
  const configuredVoiceName = args.configuredVoiceName.trim();
  const localeMatches = configuredLocale.toLowerCase().startsWith("zh-cn");
  const voiceMatches = configuredVoiceName.toLowerCase().startsWith("zh-cn-");

  if (localeMatches && voiceMatches) {
    return {
      locale: configuredLocale,
      voiceName: configuredVoiceName,
    };
  }

  return {
    locale: "zh-CN",
    voiceName: "zh-CN-XiaoxiaoNeural",
  };
}

export async function synthesizeAudioForVoiceOption(args: {
  provider: string;
  modelSlug: string;
  voiceKey: string;
  text: string;
  metadata?: Record<string, unknown>;
}) {
  const metadata = args.metadata ?? {};

  if (args.provider === "Azure") {
    const resolvedAzure = resolveAzureVoice({
      text: args.text,
      configuredLocale: getString(metadata.locale),
      configuredVoiceName: args.voiceKey,
    });

    return synthesizeAzureSpeechPreview({
      text: args.text,
      voiceName: resolvedAzure.voiceName,
      locale: resolvedAzure.locale,
      style: getString(metadata.style),
      ratePercent: getNumber(metadata.rate_percent)
    });
  }

  if (args.provider === "ElevenLabs") {
    return synthesizeElevenLabsSpeech({
      text: args.text,
      voiceId: args.voiceKey,
      modelSlug: args.modelSlug,
      metadata
    });
  }

  throw new Error(`Unsupported audio provider: ${args.provider}`);
}
