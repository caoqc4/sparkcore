import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeChatOpenILinkSession } from "@/lib/integrations/wechat-openilink";

export type WeChatOpenILinkStoredSession = {
  id: string;
  workspace_id: string;
  user_id: string;
  status: "pending" | "active" | "expired" | "revoked";
  bot_token: string;
  base_url: string;
  bot_id: string | null;
  wechat_user_id: string | null;
  sync_buf: string | null;
  last_connected_at: string | null;
  last_seen_at: string | null;
  expired_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type UpsertWeChatOpenILinkSessionArgs = {
  supabase: SupabaseClient<any, "public", any>;
  workspaceId: string;
  userId: string;
  session: WeChatOpenILinkSession;
  status?: "pending" | "active";
  metadata?: Record<string, unknown>;
};

export async function upsertActiveWeChatOpenILinkSession(
  args: UpsertWeChatOpenILinkSessionArgs
) {
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await args.supabase
    .from("wechat_openilink_sessions")
    .select("*")
    .eq("user_id", args.userId)
    .in("status", ["pending", "active"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<WeChatOpenILinkStoredSession>();

  if (existingError) {
    throw existingError;
  }

  const payload = {
    workspace_id: args.workspaceId,
    user_id: args.userId,
    status: args.status ?? "active",
    bot_token: args.session.botToken,
    base_url: args.session.baseUrl,
    bot_id: args.session.botId ?? null,
    wechat_user_id: args.session.userId ?? null,
    sync_buf: args.session.syncBuf ?? null,
    last_connected_at: now,
    last_seen_at: now,
    expired_at: null,
    metadata: {
      source: "wechat_openilink_attempt",
      ...args.metadata
    }
  };

  if (existing?.id) {
    const { data, error } = await args.supabase
      .from("wechat_openilink_sessions")
      .update({
        ...payload,
        updated_at: now
      })
      .eq("id", existing.id)
      .select("*")
      .single<WeChatOpenILinkStoredSession>();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await args.supabase
    .from("wechat_openilink_sessions")
    .insert(payload)
    .select("*")
    .single<WeChatOpenILinkStoredSession>();

  if (error) {
    throw error;
  }

  return data;
}

export async function activateWeChatOpenILinkSessionForUser(args: {
  supabase: SupabaseClient<any, "public", any>;
  workspaceId: string;
  userId: string;
  wechatUserId: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: target, error: targetError } = await args.supabase
    .from("wechat_openilink_sessions")
    .select("*")
    .eq("user_id", args.userId)
    .eq("wechat_user_id", args.wechatUserId)
    .in("status", ["pending", "active"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<WeChatOpenILinkStoredSession>();

  if (targetError) {
    throw targetError;
  }

  if (!target) {
    return null;
  }

  const now = new Date().toISOString();

  const { error: revokeError } = await args.supabase
    .from("wechat_openilink_sessions")
    .update({
      status: "revoked",
      updated_at: now,
      metadata: {
        revoked_reason: "superseded_by_new_active_session",
        revoked_at: now
      }
    })
    .eq("user_id", args.userId)
    .eq("status", "active")
    .neq("id", target.id);

  if (revokeError) {
    throw revokeError;
  }

  const { data, error } = await args.supabase
    .from("wechat_openilink_sessions")
    .update({
      workspace_id: args.workspaceId,
      status: "active",
      expired_at: null,
      last_seen_at: now,
      updated_at: now,
      metadata: {
        source: "wechat_binding_confirmation",
        ...args.metadata
      }
    })
    .eq("id", target.id)
    .select("*")
    .single<WeChatOpenILinkStoredSession>();

  if (error) {
    throw error;
  }

  return data;
}

export async function listActiveWeChatOpenILinkSessions(
  supabase: SupabaseClient<any, "public", any>
) {
  const { data, error } = await supabase
    .from("wechat_openilink_sessions")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WeChatOpenILinkStoredSession[];
}

export async function loadLatestOwnedWeChatOpenILinkSession(args: {
  supabase: SupabaseClient<any, "public", any>;
  workspaceId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_sessions")
    .select("*")
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<WeChatOpenILinkStoredSession>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export function toWeChatOpenILinkRuntimeSession(
  session: Pick<
    WeChatOpenILinkStoredSession,
    "bot_token" | "base_url" | "bot_id" | "wechat_user_id" | "sync_buf" | "updated_at"
  >
): WeChatOpenILinkSession {
  return {
    botToken: session.bot_token,
    baseUrl: session.base_url,
    botId: session.bot_id,
    userId: session.wechat_user_id,
    syncBuf: session.sync_buf,
    updatedAt: session.updated_at
  };
}

export async function updateWeChatOpenILinkSessionRuntimeState(args: {
  supabase: SupabaseClient<any, "public", any>;
  sessionId: string;
  syncBuf?: string | null;
  lastSeenAt?: string | null;
}) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (typeof args.syncBuf !== "undefined") {
    patch.sync_buf = args.syncBuf;
  }

  if (typeof args.lastSeenAt !== "undefined") {
    patch.last_seen_at = args.lastSeenAt;
  }

  const { data, error } = await args.supabase
    .from("wechat_openilink_sessions")
    .update(patch)
    .eq("id", args.sessionId)
    .select("*")
    .single<WeChatOpenILinkStoredSession>();

  if (error) {
    throw error;
  }

  return data;
}

export async function markWeChatOpenILinkSessionExpired(args: {
  supabase: SupabaseClient<any, "public", any>;
  sessionId: string;
  reason?: string | null;
}) {
  const now = new Date().toISOString();
  const { data, error } = await args.supabase
    .from("wechat_openilink_sessions")
    .update({
      status: "expired",
      expired_at: now,
      updated_at: now,
      metadata: {
        expired_reason: args.reason ?? "session_expired",
        expired_at: now
      }
    })
    .eq("id", args.sessionId)
    .select("*")
    .single<WeChatOpenILinkStoredSession>();

  if (error) {
    throw error;
  }

  return data;
}

export async function revokeWeChatOpenILinkSessionsForUser(args: {
  supabase: SupabaseClient<any, "public", any>;
  userId: string;
  wechatUserId?: string | null;
  reason?: string | null;
}) {
  const now = new Date().toISOString();
  let query = args.supabase
    .from("wechat_openilink_sessions")
    .update({
      status: "revoked",
      expired_at: now,
      updated_at: now,
      metadata: {
        revoked_reason: args.reason ?? "user_unbound_channel",
        revoked_at: now
      }
    })
    .eq("user_id", args.userId)
    .in("status", ["pending", "active"]);

  if (args.wechatUserId) {
    query = query.eq("wechat_user_id", args.wechatUserId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}
