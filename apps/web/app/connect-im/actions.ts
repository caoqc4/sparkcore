"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import { activateWeChatOpenILinkSessionForUser } from "@/lib/integrations/wechat-openilink-sessions";
import { loadChannelPlatformCapability } from "@/lib/product/channels";
import { isCharacterChannelSlug } from "@/lib/product/character-channels";

const PLATFORM_LABELS = {
  telegram: "Telegram",
  discord: "Discord",
  feishu: "Feishu",
  wechat: "WeChat",
} as const;

type SupportedBindingPlatform = keyof typeof PLATFORM_LABELS;

function redirectWithMessage(args: {
  agentId?: string | null;
  platform?: string | null;
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

  if (args.platform) {
    searchParams.set("platform", args.platform);
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

async function connectBinding(
  platform: SupportedBindingPlatform,
  formData: FormData
) {
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
      platform,
      threadId,
      agentId,
      feedback: `Create or select a role thread before binding ${PLATFORM_LABELS[platform]}.`,
      feedbackType: "error"
    });
  }

  if (!channelId || !peerId || !platformUserId) {
    redirectWithMessage({
      platform,
      threadId,
      agentId,
      feedback: `${PLATFORM_LABELS[platform]} binding requires a channel id and user id.`,
      feedbackType: "error"
    });
  }

  if (!characterChannelSlug) {
    redirectWithMessage({
      platform,
      threadId,
      agentId,
      feedback: `${PLATFORM_LABELS[platform]} binding requires a valid character channel.`,
      feedbackType: "error"
    });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const loginParams = new URLSearchParams();
    loginParams.set("thread", threadId);
    loginParams.set("agent", agentId);
    loginParams.set("platform", platform);
    redirect(`/login?next=${encodeURIComponent(`/connect-im?${loginParams.toString()}`)}`);
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirectWithMessage({
      platform,
      threadId,
      agentId,
      feedback: "No workspace is available for this account.",
      feedbackType: "error"
    });
  }

  const capability = await loadChannelPlatformCapability({
    supabase,
    platform
  });

  if (
    !capability ||
    capability.availabilityStatus !== "active" ||
    !capability.supportsBinding
  ) {
    redirectWithMessage({
      platform,
      threadId,
      agentId,
      feedback: `${PLATFORM_LABELS[platform]} binding is not available in this environment yet.`,
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
      platform,
      threadId,
      agentId,
      feedback: "The selected role or thread is unavailable.",
      feedbackType: "error"
    });
  }

  const identity = {
    platform,
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
      platform,
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

  const deactivateConflictingBindings = async (excludeId?: string) => {
    let query = supabase
      .from("channel_bindings")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
        metadata: {
          ...payload.metadata,
          superseded_by_platform_identity: true
        }
      })
      .eq("user_id", user.id)
      .eq("platform", platform)
      .eq("channel_id", channelId)
      .eq("peer_id", peerId)
      .eq("platform_user_id", platformUserId)
      .eq("status", "active");

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { error } = await query;

    if (error) {
      redirectWithMessage({
        platform,
        threadId,
        agentId,
        feedback: error.message,
        feedbackType: "error"
      });
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
        platform,
        threadId,
        agentId,
        feedback: error.message,
        feedbackType: "error"
      });
    }

    await deactivateConflictingBindings(existingBinding.id);
  } else {
    await deactivateConflictingBindings();

    const { error } = await supabase.from("channel_bindings").insert(payload);

    if (error) {
      redirectWithMessage({
        platform,
        threadId,
        agentId,
        feedback: error.message,
        feedbackType: "error"
      });
    }
  }

  if (platform === "wechat") {
    let activatedSession = null;

    try {
      activatedSession = await activateWeChatOpenILinkSessionForUser({
        supabase,
        workspaceId: workspace.id,
        userId: user.id,
        wechatUserId: platformUserId,
        metadata: {
          thread_id: threadResult.data.id,
          agent_id: agentResult.data.id
        }
      });

    } catch (error) {
      redirectWithMessage({
        platform,
        threadId,
        agentId,
        feedback: error instanceof Error ? error.message : "Failed to activate the WeChat session.",
        feedbackType: "error"
      });
    }

    if (!activatedSession) {
      redirectWithMessage({
        platform,
        threadId,
        agentId,
        feedback:
          "WeChat session not found. Start the WeChat login flow again, send the bot any message, then retry the binding.",
        feedbackType: "error"
      });
    }
  }

  revalidatePath("/connect-im");
  revalidatePath("/app");
  revalidatePath("/app/channels");
  revalidatePath("/app/settings");

  const channelsParams = new URLSearchParams();
  channelsParams.set("role", agentId);
  channelsParams.set("thread", threadId);
  channelsParams.set(
    "feedback",
    `${PLATFORM_LABELS[platform]} connected. You can now chat through that app.`
  );
  channelsParams.set("feedback_type", "success");
  redirect(`/app/channels?${channelsParams.toString()}`);
}

export async function connectTelegramBinding(formData: FormData) {
  return connectBinding("telegram", formData);
}

export async function connectDiscordBinding(formData: FormData) {
  return connectBinding("discord", formData);
}

export async function connectFeishuBinding(formData: FormData) {
  return connectBinding("feishu", formData);
}

export async function connectWeChatBinding(formData: FormData) {
  return connectBinding("wechat", formData);
}
