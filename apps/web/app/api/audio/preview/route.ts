import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-redirect";
import {
  asMetadataRecord,
  getString,
  synthesizeAudioForVoiceOption
} from "@/lib/audio/synthesis";
import { loadActiveAudioAssetById } from "@/lib/product/role-media";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildPreviewCopy(displayName: string) {
  return `Hi, this is ${displayName}. I am ready to support you with a calm, natural voice in SparkCore.`;
}

export async function POST(request: Request) {
  await requireUser("/app/role");

  let payload: { audioAssetId?: string };

  try {
    payload = (await request.json()) as { audioAssetId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const audioAssetId = getString(payload.audioAssetId);
  if (!audioAssetId) {
    return NextResponse.json({ error: "audioAssetId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: audioAsset } = await loadActiveAudioAssetById({
    supabase,
    audioAssetId
  });

  if (!audioAsset) {
    return NextResponse.json({ error: "Audio voice option not found." }, { status: 404 });
  }

  const metadata = asMetadataRecord(audioAsset.metadata);
  const voiceName = getString(audioAsset.voice_key);
  if (!voiceName) {
    return NextResponse.json({ error: "Voice key is missing." }, { status: 400 });
  }

  try {
    const audio = await synthesizeAudioForVoiceOption({
      text: buildPreviewCopy(audioAsset.display_name ?? "your companion"),
      provider: audioAsset.provider,
      modelSlug: audioAsset.model_slug,
      voiceKey: voiceName,
      metadata
    });

    return new NextResponse(audio.audioBuffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": audio.contentType
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Audio preview failed."
      },
      { status: 502 }
    );
  }
}
