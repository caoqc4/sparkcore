import type { AgentRecord, RoleProfile } from "@/lib/chat/role-core";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";

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
  const repository = new SupabaseRoleRepository(supabase);
  const result = await resolveRoleProfile({
    repository,
    workspaceId,
    userId,
    requestedAgentId: agentId
  });

  return result.status === "resolved" ? result.role : null;
}
