const WORKSPACE_SELECT = "id, name, kind";
const THREAD_SELECT = "id, title, status, agent_id, workspace_id, created_at, updated_at";
const AGENT_SELECT =
  "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata";

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
