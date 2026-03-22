import type {
  BindingLookupInput,
  BindingRepository,
  ChannelBinding
} from "./contract";

export const DEFAULT_BINDING_TABLE = "channel_bindings";

export type BindingRow = {
  platform: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  workspace_id: string;
  user_id: string;
  agent_id: string;
  thread_id?: string | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown> | null;
};

export function mapBindingRowToChannelBinding(row: BindingRow): ChannelBinding {
  return {
    platform: row.platform,
    channel_id: row.channel_id,
    peer_id: row.peer_id,
    platform_user_id: row.platform_user_id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    agent_id: row.agent_id,
    thread_id: row.thread_id ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata ?? undefined
  };
}

export class SupabaseBindingRepository implements BindingRepository {
  constructor(
    private readonly supabase: any,
    private readonly tableName: string = DEFAULT_BINDING_TABLE
  ) {}

  async findActiveBinding(
    input: BindingLookupInput
  ): Promise<ChannelBinding | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        "platform, channel_id, peer_id, platform_user_id, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
      )
      .eq("platform", input.platform)
      .eq("channel_id", input.channel_id)
      .eq("peer_id", input.peer_id)
      .eq("platform_user_id", input.platform_user_id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load channel binding from ${this.tableName}: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return mapBindingRowToChannelBinding(data as BindingRow);
  }
}
