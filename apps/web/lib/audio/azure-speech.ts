import { getAzureSpeechEnv } from "@/lib/env";

const AZURE_TTS_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatProsodyRate(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }

  const bounded = clamp(Math.round(value), -50, 100);
  return `${bounded >= 0 ? "+" : ""}${bounded}%`;
}

function buildSsml(args: {
  text: string;
  locale: string;
  voiceName: string;
  style?: string | null;
  ratePercent?: number | null;
}) {
  const escapedText = escapeXml(args.text);
  const rate = formatProsodyRate(args.ratePercent);
  const style = args.style?.trim();
  const inner = style
    ? [
        `    <mstts:express-as style="${escapeXml(style)}">`,
        `      <prosody rate="${rate}">${escapedText}</prosody>`,
        "    </mstts:express-as>"
      ]
    : [`    <prosody rate="${rate}">${escapedText}</prosody>`];

  return [
    `<speak version="1.0" xml:lang="${escapeXml(args.locale)}" xmlns:mstts="https://www.w3.org/2001/mstts">`,
    `  <voice name="${escapeXml(args.voiceName)}">`,
    ...inner,
    "  </voice>",
    "</speak>"
  ].join("\n");
}

export async function synthesizeAzureSpeechPreview(args: {
  text: string;
  voiceName: string;
  locale?: string | null;
  style?: string | null;
  ratePercent?: number | null;
}) {
  const { apiKey, region } = getAzureSpeechEnv();
  const locale = args.locale?.trim() || "en-US";
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = buildSsml({
    text: args.text,
    voiceName: args.voiceName,
    locale,
    style: args.style,
    ratePercent: args.ratePercent
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "Ocp-Apim-Subscription-Key": apiKey,
      "User-Agent": "sparkcore-web",
      "X-Microsoft-OutputFormat": AZURE_TTS_OUTPUT_FORMAT
    },
    body: ssml,
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Azure Speech request failed (${response.status}): ${errorText || "Unknown error"}`
    );
  }

  return {
    audioBuffer: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") || "audio/mpeg"
  };
}
