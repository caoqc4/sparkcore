import type { AgentRecord, RoleProfile } from "@/lib/chat/role-core";

export const ROLE_PROFILE_SELECT =
  "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata";

function asRoleProfile(record: unknown): RoleProfile | null {
  return record ? (record as RoleProfile) : null;
}

export async function loadRoleProfile({
  supabase,
  workspaceId,
  userId,
  agentId
}: {
  supabase: any;
  workspaceId: string;
  userId: string;
  agentId?: string | null;
}): Promise<AgentRecord | null> {
  let query = supabase
    .from("agents")
    .select(ROLE_PROFILE_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("owner_user_id", userId)
    .eq("status", "active");

  if (agentId) {
    const { data } = await query.eq("id", agentId).maybeSingle();
    return asRoleProfile(data);
  }

  const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();

  return asRoleProfile(data);
}
