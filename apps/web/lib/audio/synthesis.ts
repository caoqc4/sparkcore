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

export async function synthesizeAudioForVoiceOption(args: {
  provider: string;
  modelSlug: string;
  voiceKey: string;
  text: string;
  metadata?: Record<string, unknown>;
}) {
  const metadata = args.metadata ?? {};

  if (args.provider === "Azure") {
    return synthesizeAzureSpeechPreview({
      text: args.text,
      voiceName: args.voiceKey,
      locale: getString(metadata.locale) ?? "en-US",
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
