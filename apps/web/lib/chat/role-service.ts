import type { RoleProfile } from "@/lib/chat/role-core";
import type { RoleRepository } from "@/lib/chat/role-repository";

export type ResolveRoleProfileInput = {
  workspaceId: string;
  userId: string;
  requestedAgentId?: string | null;
};

export type ResolveRoleProfileResult =
  | {
      status: "resolved";
      role: RoleProfile;
      resolution: "requested-agent" | "latest-active-fallback";
    }
  | {
      status: "not_found";
      resolution: "requested-agent-missing" | "no-active-role";
    };

export async function resolveRoleProfile({
  repository,
  workspaceId,
  userId,
  requestedAgentId
}: ResolveRoleProfileInput & {
  repository: RoleRepository;
}): Promise<ResolveRoleProfileResult> {
  if (requestedAgentId) {
    const role = await repository.getRoleProfileById({
      workspaceId,
      userId,
      agentId: requestedAgentId
    });

    if (!role) {
      return {
        status: "not_found",
        resolution: "requested-agent-missing"
      };
    }

    return {
      status: "resolved",
      role,
      resolution: "requested-agent"
    };
  }

  const role = await repository.getLatestActiveRoleProfile({
    workspaceId,
    userId
  });

  if (!role) {
    return {
      status: "not_found",
      resolution: "no-active-role"
    };
  }

  return {
    status: "resolved",
    role,
    resolution: "latest-active-fallback"
  };
}
