import type { SupabaseClient } from "@supabase/supabase-js";

export type WeChatOpenILinkLoginAttemptStatus =
  | "starting"
  | "qr_ready"
  | "scanned"
  | "connected"
  | "identity_ready"
  | "error";

export type WeChatOpenILinkLoginAttempt = {
  id: string;
  user_id: string;
  workspace_id: string;
  status: WeChatOpenILinkLoginAttemptStatus;
  qr_url: string | null;
  error_message: string | null;
  bot_id: string | null;
  wechat_user_id: string | null;
  channel_id: string | null;
  peer_id: string | null;
  platform_user_id: string | null;
  connected_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type WeChatOpenILinkLoginAttemptPatch = Partial<
  Omit<
    WeChatOpenILinkLoginAttempt,
    "id" | "user_id" | "workspace_id" | "created_at" | "updated_at"
  >
>;

type SupabaseLike = SupabaseClient<any, "public", any>;

export async function createWeChatOpenILinkLoginAttempt(args: {
  supabase: SupabaseLike;
  userId: string;
  workspaceId: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .insert({
      user_id: args.userId,
      workspace_id: args.workspaceId,
      status: "starting",
      metadata: args.metadata ?? {}
    })
    .select("*")
    .single<WeChatOpenILinkLoginAttempt>();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadOwnedWeChatOpenILinkLoginAttempt(args: {
  supabase: SupabaseLike;
  attemptId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .select("*")
    .eq("id", args.attemptId)
    .eq("user_id", args.userId)
    .maybeSingle<WeChatOpenILinkLoginAttempt>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function loadWeChatOpenILinkLoginAttemptById(args: {
  supabase: SupabaseLike;
  attemptId: string;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .select("*")
    .eq("id", args.attemptId)
    .maybeSingle<WeChatOpenILinkLoginAttempt>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function updateWeChatOpenILinkLoginAttempt(args: {
  supabase: SupabaseLike;
  attemptId: string;
  patch: WeChatOpenILinkLoginAttemptPatch;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .update(args.patch)
    .eq("id", args.attemptId)
    .select("*")
    .maybeSingle<WeChatOpenILinkLoginAttempt>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function listStartingWeChatOpenILinkLoginAttempts(args: {
  supabase: SupabaseLike;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .select("*")
    .eq("status", "starting")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WeChatOpenILinkLoginAttempt[];
}

export async function findPendingWeChatOpenILinkLoginAttemptByWeChatUserId(args: {
  supabase: SupabaseLike;
  wechatUserId: string;
}) {
  const { data, error } = await args.supabase
    .from("wechat_openilink_login_attempts")
    .select("*")
    .eq("wechat_user_id", args.wechatUserId)
    .in("status", ["connected", "identity_ready"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<WeChatOpenILinkLoginAttempt>();

  if (error) {
    throw error;
  }

  return data ?? null;
}
