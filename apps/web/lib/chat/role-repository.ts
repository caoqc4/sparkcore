import type { RoleProfile } from "@/lib/chat/role-core";

export const ROLE_PROFILE_SELECT =
  "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata";

export type GetRoleProfileByIdInput = {
  workspaceId: string;
  userId: string;
  agentId: string;
};

export type GetLatestActiveRoleProfileInput = {
  workspaceId: string;
  userId: string;
};

export type RoleRepository = {
  getRoleProfileById: (
    input: GetRoleProfileByIdInput
  ) => Promise<RoleProfile | null>;
  getLatestActiveRoleProfile: (
    input: GetLatestActiveRoleProfileInput
  ) => Promise<RoleProfile | null>;
};

function loadSupabaseRoleProfileById(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  agentId: string;
}) {
  return args.supabase
    .from("agents")
    .select(ROLE_PROFILE_SELECT)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active")
    .eq("id", args.agentId)
    .maybeSingle();
}

function loadSupabaseLatestActiveRoleProfile(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  return args.supabase
    .from("agents")
    .select(ROLE_PROFILE_SELECT)
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

function asRoleProfile(record: unknown): RoleProfile | null {
  return record ? (record as RoleProfile) : null;
}

export class InMemoryRoleRepository implements RoleRepository {
  constructor(private readonly records: RoleProfile[] = []) {}

  async getRoleProfileById(
    input: GetRoleProfileByIdInput
  ): Promise<RoleProfile | null> {
    return (
      this.records.find((record) => record.id === input.agentId) ?? null
    );
  }

  async getLatestActiveRoleProfile(): Promise<RoleProfile | null> {
    return this.records[0] ?? null;
  }
}

export class SupabaseRoleRepository implements RoleRepository {
  constructor(private readonly supabase: any) {}

  async getRoleProfileById(
    input: GetRoleProfileByIdInput
  ): Promise<RoleProfile | null> {
    const { data } = await loadSupabaseRoleProfileById({
      supabase: this.supabase,
      workspaceId: input.workspaceId,
      userId: input.userId,
      agentId: input.agentId
    });

    return asRoleProfile(data);
  }

  async getLatestActiveRoleProfile(
    input: GetLatestActiveRoleProfileInput
  ): Promise<RoleProfile | null> {
    const { data } = await loadSupabaseLatestActiveRoleProfile({
      supabase: this.supabase,
      workspaceId: input.workspaceId,
      userId: input.userId
    });

    return asRoleProfile(data);
  }
}
