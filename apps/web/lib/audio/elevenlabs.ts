import { getElevenLabsEnv } from "@/lib/env";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveElevenLabsModelId(modelSlug: string, metadata: Record<string, unknown>) {
  if (typeof metadata.model_id === "string" && metadata.model_id.trim().length > 0) {
    return metadata.model_id.trim();
  }

  if (modelSlug === "audio-elevenlabs-v3") {
    return "eleven_v3";
  }

  return "eleven_multilingual_v2";
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function synthesizeElevenLabsSpeech(args: {
  text: string;
  voiceId: string;
  modelSlug: string;
  metadata?: Record<string, unknown>;
}) {
  const { apiKey } = getElevenLabsEnv();
  const metadata = args.metadata ?? {};
  const modelId = resolveElevenLabsModelId(args.modelSlug, metadata);
  const stability = clamp(getNumber(metadata.stability, 0.45), 0, 1);
  const similarityBoost = clamp(getNumber(metadata.similarity_boost, 0.8), 0, 1);
  const style = clamp(getNumber(metadata.style, 0.2), 0, 1);
  const useSpeakerBoost =
    typeof metadata.use_speaker_boost === "boolean" ? metadata.use_speaker_boost : true;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(args.voiceId)}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: args.text,
        model_id: modelId,
        output_format: "mp3_44100_128",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs request failed (${response.status}): ${errorText || "Unknown error"}`
    );
  }

  return {
    audioBuffer: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") || "audio/mpeg"
  };
}
