"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import { loadChannelPlatformCapability } from "@/lib/product/channels";
import { isCharacterChannelSlug } from "@/lib/product/character-channels";

function redirectWithMessage(args: {
  agentId?: string | null;
  threadId?: string | null;
  feedback: string;
  feedbackType: "error" | "success";
}): never {
  const searchParams = new URLSearchParams();

  if (args.threadId) {
    searchParams.set("thread", args.threadId);
  }

  if (args.agentId) {
    searchParams.set("agent", args.agentId);
  }

  searchParams.set("feedback", args.feedback);
  searchParams.set("feedback_type", args.feedbackType);

  redirect(`/connect-im?${searchParams.toString()}`);
}

function normalizeIdentityField(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

export async function connectTelegramBinding(formData: FormData) {
  const threadId = normalizeIdentityField(formData.get("thread_id"));
  const agentId = normalizeIdentityField(formData.get("agent_id"));
  const channelId = normalizeIdentityField(formData.get("channel_id"));
  const peerId = normalizeIdentityField(formData.get("peer_id"));
  const platformUserId = normalizeIdentityField(formData.get("platform_user_id"));
  const rawCharacterChannelSlug = normalizeIdentityField(
    formData.get("character_channel_slug")
  );
  const characterChannelSlug = isCharacterChannelSlug(rawCharacterChannelSlug)
    ? rawCharacterChannelSlug
    : null;

  if (!threadId || !agentId) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: "Create or select a role thread before binding Telegram.",
      feedbackType: "error"
    });
  }

  if (!channelId || !peerId || !platformUserId) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: "Telegram binding requires channel id, peer id, and platform user id.",
      feedbackType: "error"
    });
  }

  if (!characterChannelSlug) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: "Telegram binding requires a valid character channel.",
      feedbackType: "error"
    });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/connect-im?thread=${threadId}&agent=${agentId}`)}`);
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: "No workspace is available for this account.",
      feedbackType: "error"
    });
  }

  const telegramCapability = await loadChannelPlatformCapability({
    supabase,
    platform: "telegram"
  });

  if (
    !telegramCapability ||
    telegramCapability.availabilityStatus !== "active" ||
    !telegramCapability.supportsBinding
  ) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback:
        "Telegram binding is not available in this environment yet.",
      feedbackType: "error"
    });
  }

  const [threadResult, agentResult] = await Promise.all([
    loadOwnedThread({
      supabase,
      threadId,
      workspaceId: workspace.id,
      userId: user.id
    }),
    loadOwnedActiveAgent({
      supabase,
      agentId,
      workspaceId: workspace.id,
      userId: user.id
    })
  ]);

  if (!threadResult.data || !agentResult.data) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: "The selected role or thread is unavailable.",
      feedbackType: "error"
    });
  }

  const identity = {
    platform: "telegram",
    channel_id: channelId,
    peer_id: peerId,
    platform_user_id: platformUserId,
    character_channel_slug: characterChannelSlug
  };

  const { data: existingBinding, error: existingError } = await supabase
    .from("channel_bindings")
    .select("id")
    .match(identity)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    redirectWithMessage({
      threadId,
      agentId,
      feedback: existingError.message,
      feedbackType: "error"
    });
  }

  const payload = {
    ...identity,
    workspace_id: workspace.id,
    user_id: user.id,
    agent_id: agentResult.data.id,
    thread_id: threadResult.data.id,
    status: "active",
    metadata: {
      source: "product_connect_im",
      managed_by: "connect-im-page",
      character_channel_slug: characterChannelSlug
    }
  };

  if (existingBinding?.id) {
    const { error } = await supabase
      .from("channel_bindings")
      .update({
        workspace_id: payload.workspace_id,
        user_id: payload.user_id,
        agent_id: payload.agent_id,
        thread_id: payload.thread_id,
        status: payload.status,
      metadata: payload.metadata,
      updated_at: new Date().toISOString()
    })
      .eq("id", existingBinding.id);

    if (error) {
      redirectWithMessage({
        threadId,
        agentId,
        feedback: error.message,
        feedbackType: "error"
      });
    }
  } else {
    const { error } = await supabase.from("channel_bindings").insert(payload);

    if (error) {
      redirectWithMessage({
        threadId,
        agentId,
        feedback: error.message,
        feedbackType: "error"
      });
    }
  }

  revalidatePath("/connect-im");
  revalidatePath("/app");
  revalidatePath("/app/channels");
  revalidatePath("/app/settings");

  const channelsParams = new URLSearchParams();
  channelsParams.set("feedback", "Telegram connected. You can now chat via the bot.");
  channelsParams.set("feedback_type", "success");
  redirect(`/app/channels?${channelsParams.toString()}`);
}
