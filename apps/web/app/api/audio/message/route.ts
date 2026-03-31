import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-redirect";
import {
  asMetadataRecord,
  getString,
  synthesizeAudioForVoiceOption
} from "@/lib/audio/synthesis";
import { loadScopedMessageById } from "@/lib/chat/message-read";
import { loadPrimaryWorkspace, loadOwnedThread } from "@/lib/chat/runtime-turn-context";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import {
  loadOwnedRoleMediaProfile,
  resolveConsumableAudioAsset
} from "@/lib/product/role-media";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser("/chat");

  let payload: { threadId?: string; messageId?: string };

  try {
    payload = (await request.json()) as { threadId?: string; messageId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const threadId = getString(payload.threadId);
  const messageId = getString(payload.messageId);

  if (!threadId || !messageId) {
    return NextResponse.json(
      { error: "threadId and messageId are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  if (!thread.agent_id) {
    return NextResponse.json({ error: "Thread has no bound role." }, { status: 400 });
  }

  const { data: message } = await loadScopedMessageById({
    supabase,
    messageId,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    select: "id, role, content, status"
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (message.role !== "assistant" || message.status !== "completed") {
    return NextResponse.json(
      { error: "Only completed assistant replies can be played." },
      { status: 400 }
    );
  }

  if (typeof message.content !== "string" || message.content.trim().length === 0) {
    return NextResponse.json({ error: "Message has no playable content." }, { status: 400 });
  }

  const { data: roleMediaProfile } = await loadOwnedRoleMediaProfile({
    supabase,
    agentId: thread.agent_id,
    workspaceId: workspace.id,
    userId: user.id
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
    return NextResponse.json({ error: "No voice is bound to this role yet." }, { status: 400 });
  }

  const currentPlanSlug = await loadCurrentProductPlanSlug({
    supabase,
    userId: user.id
  });
  const { data: audioAsset } = await resolveConsumableAudioAsset({
    supabase,
    currentPlanSlug,
    requestedAudioAssetId: audioAssetId
  });

  if (!audioAsset) {
    return NextResponse.json({ error: "Bound voice is unavailable." }, { status: 404 });
  }

  const voiceName = getString(audioAsset.voice_key);
  if (!voiceName) {
    return NextResponse.json({ error: "Voice key is missing." }, { status: 400 });
  }

  const metadata = asMetadataRecord(audioAsset.metadata);

  try {
    const audio = await synthesizeAudioForVoiceOption({
      text: message.content,
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
        error: error instanceof Error ? error.message : "Audio generation failed."
      },
      { status: 502 }
    );
  }
}
