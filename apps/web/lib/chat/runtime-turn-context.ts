import { loadRecentOwnedMemories as loadRecentOwnedMemoryItems } from "@/lib/chat/memory-item-read";
import {
  loadCompletedMessagesForThreads as loadCompletedThreadMessages,
  loadMessagesByIds
} from "@/lib/chat/message-read";

const WORKSPACE_SELECT = "id, name, kind";
const THREAD_SELECT = "id, title, status, agent_id, workspace_id, created_at, updated_at";
const AGENT_SELECT =
  "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata";
const ACTIVE_AGENT_LIST_SELECT =
  "id, name, is_custom, persona_summary, system_prompt, source_persona_pack_id, default_model_profile_id, metadata";
const ACTIVE_PERSONA_PACK_SELECT =
  "id, slug, name, persona_summary, style_prompt, system_prompt, metadata";
const ACTIVE_MODEL_PROFILE_SELECT =
  "id, slug, name, provider, model, temperature, max_output_tokens, metadata";

export async function loadPrimaryWorkspace(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase
    .from("workspaces")
    .select(WORKSPACE_SELECT)
    .eq("owner_user_id", args.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
}

export async function loadOwnedWorkspace(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("workspaces")
    .select(WORKSPACE_SELECT)
    .eq("id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .maybeSingle();
}

export async function loadOwnedWorkspaceBySlug(args: {
  supabase: any;
  workspaceSlug: string;
  userId: string;
}) {
  return args.supabase
    .from("workspaces")
    .select(WORKSPACE_SELECT)
    .eq("owner_user_id", args.userId)
    .eq("slug", args.workspaceSlug)
    .maybeSingle();
}

export async function loadOwnedThread(args: {
  supabase: any;
  threadId: string;
  userId: string;
  workspaceId?: string;
}) {
  let query = args.supabase
    .from("threads")
    .select(THREAD_SELECT)
    .eq("id", args.threadId)
    .eq("owner_user_id", args.userId);

  if (args.workspaceId) {
    query = query.eq("workspace_id", args.workspaceId);
  }

  return query.maybeSingle();
}

export async function loadLatestOwnedThread(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function loadOwnedThreads(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .order("updated_at", { ascending: false });
}

export function deleteOwnedThreads(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase.from("threads").delete().eq("owner_user_id", args.userId);
}

export async function loadOwnedActiveAgent(args: {
  supabase: any;
  agentId: string;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("agents")
    .select(AGENT_SELECT)
    .eq("id", args.agentId)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active")
    .maybeSingle();
}

export function deleteOwnedAgents(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase.from("agents").delete().eq("owner_user_id", args.userId);
}

export async function loadOwnedActiveAgentByName(args: {
  supabase: any;
  agentName: string;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("agents")
    .select(AGENT_SELECT)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active")
    .eq("name", args.agentName)
    .maybeSingle();
}

export async function createOwnedAgent(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  sourcePersonaPackId: string;
  name: string;
  personaSummary: string;
  stylePrompt: string;
  systemPrompt: string;
  defaultModelProfileId: string;
  isCustom?: boolean;
  metadata?: Record<string, unknown>;
  select?: string;
}) {
  return args.supabase
    .from("agents")
    .insert({
      workspace_id: args.workspaceId,
      owner_user_id: args.userId,
      source_persona_pack_id: args.sourcePersonaPackId,
      name: args.name,
      persona_summary: args.personaSummary,
      style_prompt: args.stylePrompt,
      system_prompt: args.systemPrompt,
      default_model_profile_id: args.defaultModelProfileId,
      is_custom: args.isCustom ?? false,
      ...(args.metadata ? { metadata: args.metadata } : {})
    })
    .select(args.select ?? AGENT_SELECT)
    .single();
}

export async function bindOwnedAgentModelProfile(args: {
  supabase: any;
  agentId: string;
  workspaceId: string;
  userId: string;
  modelProfileId: string;
}) {
  return args.supabase
    .from("agents")
    .update({
      default_model_profile_id: args.modelProfileId,
      updated_at: new Date().toISOString()
    })
    .eq("id", args.agentId)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId);
}

export function updateOwnedAgent(args: {
  supabase: any;
  agentId: string;
  workspaceId: string;
  userId: string;
  patch: Record<string, unknown>;
  select?: string;
}) {
  let query = args.supabase
    .from("agents")
    .update(args.patch)
    .eq("id", args.agentId)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId);

  if (args.select) {
    query = query.select(args.select);
  }

  return query;
}

export async function createOwnedThread(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  agentId: string;
  title?: string;
}) {
  return args.supabase
    .from("threads")
    .insert({
      workspace_id: args.workspaceId,
      owner_user_id: args.userId,
      agent_id: args.agentId,
      title: args.title ?? "New chat"
    })
    .select("id, title, status, agent_id, created_at, updated_at")
    .single();
}

export async function bindOwnedThreadAgent(args: {
  supabase: any;
  threadId: string;
  userId: string;
  agentId: string;
}) {
  return args.supabase
    .from("threads")
    .update({
      agent_id: args.agentId,
      updated_at: new Date().toISOString()
    })
    .eq("id", args.threadId)
    .eq("owner_user_id", args.userId)
    .select("id, title, status, agent_id, created_at, updated_at")
    .single();
}

export function updateOwnedThread(args: {
  supabase: any;
  threadId: string;
  userId: string;
  patch: Record<string, unknown>;
  select?: string;
}) {
  let query = args.supabase
    .from("threads")
    .update(args.patch)
    .eq("id", args.threadId)
    .eq("owner_user_id", args.userId);

  if (args.select) {
    query = query.select(args.select);
  }

  return query;
}

export async function loadActivePersonaPacks(args: {
  supabase: any;
}) {
  return args.supabase
    .from("persona_packs")
    .select("id, slug, name, description, persona_summary")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
}

export async function loadActivePersonaPacksBySlugs(args: {
  supabase: any;
  slugs: string[];
}) {
  return args.supabase
    .from("persona_packs")
    .select(
      "id, slug, name, description, persona_summary, style_prompt, system_prompt, metadata"
    )
    .in("slug", args.slugs)
    .eq("is_active", true);
}

export async function loadActivePersonaPackBySlug(args: {
  supabase: any;
  slug: string;
}) {
  return args.supabase
    .from("persona_packs")
    .select(ACTIVE_PERSONA_PACK_SELECT)
    .eq("slug", args.slug)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadActivePersonaPackById(args: {
  supabase: any;
  personaPackId: string;
}) {
  return args.supabase
    .from("persona_packs")
    .select(ACTIVE_PERSONA_PACK_SELECT)
    .eq("id", args.personaPackId)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadFirstActivePersonaPack(args: {
  supabase: any;
}) {
  return args.supabase
    .from("persona_packs")
    .select(ACTIVE_PERSONA_PACK_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
}

export async function loadOwnedAvailableAgents(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("agents")
    .select(ACTIVE_AGENT_LIST_SELECT)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false });
}

export async function loadOwnedActiveAgentsByIds(args: {
  supabase: any;
  agentIds: string[];
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("agents")
    .select(AGENT_SELECT)
    .in("id", args.agentIds)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active");
}

export async function loadActiveModelProfiles(args: {
  supabase: any;
}) {
  return args.supabase
    .from("model_profiles")
    .select("id, name, provider, model, metadata")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
}

export async function loadActiveModelProfilesBySlugs(args: {
  supabase: any;
  slugs: string[];
}) {
  return args.supabase
    .from("model_profiles")
    .select("id, slug, name, provider, model, metadata")
    .in("slug", args.slugs)
    .eq("is_active", true);
}

export async function loadActiveModelProfileBySlug(args: {
  supabase: any;
  slug: string;
}) {
  return args.supabase
    .from("model_profiles")
    .select(ACTIVE_MODEL_PROFILE_SELECT)
    .eq("slug", args.slug)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadFirstActiveModelProfile(args: {
  supabase: any;
}) {
  return args.supabase
    .from("model_profiles")
    .select(ACTIVE_MODEL_PROFILE_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
}

export async function loadActiveModelProfileById(args: {
  supabase: any;
  modelProfileId: string;
}) {
  return args.supabase
    .from("model_profiles")
    .select(ACTIVE_MODEL_PROFILE_SELECT)
    .eq("id", args.modelProfileId)
    .eq("is_active", true)
    .maybeSingle();
}

export async function loadOwnedUserAppSettingsMetadata(args: {
  supabase: any;
  userId: string;
}) {
  return args.supabase
    .from("user_app_settings")
    .select("metadata")
    .eq("user_id", args.userId)
    .maybeSingle();
}

export async function loadRecentOwnedMemories(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  limit?: number;
}) {
  return loadRecentOwnedMemoryItems({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, metadata, source_message_id, created_at, updated_at",
    limit: args.limit ?? 60
  });
}

export async function loadPersonaPackNamesByIds(args: {
  supabase: any;
  personaPackIds: string[];
}) {
  return args.supabase
    .from("persona_packs")
    .select("id, name")
    .in("id", args.personaPackIds);
}

export async function loadModelProfilesByIds(args: {
  supabase: any;
  modelProfileIds: string[];
}) {
  return args.supabase
    .from("model_profiles")
    .select("id, name, metadata")
    .in("id", args.modelProfileIds)
    .eq("is_active", true);
}

export async function loadSourceMessagesByIds(args: {
  supabase: any;
  sourceMessageIds: string[];
  workspaceId: string;
}) {
  return loadMessagesByIds({
    supabase: args.supabase,
    messageIds: args.sourceMessageIds,
    workspaceId: args.workspaceId,
    select: "id, thread_id, role, content, status, created_at"
  });
}

export async function loadOwnedThreadTitlesByIds(args: {
  supabase: any;
  threadIds: string[];
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("threads")
    .select("id, title")
    .in("id", args.threadIds)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId);
}

export async function loadCompletedMessagesForThreads(args: {
  supabase: any;
  threadIds: string[];
  workspaceId: string;
  select?: string;
}) {
  return loadCompletedThreadMessages(args);
}
