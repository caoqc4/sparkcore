import type { AgentRecord, RoleProfile } from "@/lib/chat/role-core";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";

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

  if (agentId) {
    return repository.getRoleProfileById({
      workspaceId,
      userId,
      agentId
    });
  }

  return repository.getLatestActiveRoleProfile({
    workspaceId,
    userId
  });
}
