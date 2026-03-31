import {
  loadPrimaryWorkspace,
  loadOwnedActiveAgentsByIds,
  loadOwnedThreadTitlesByIds
} from "@/lib/chat/runtime-turn-context";

export type ProductChannelBinding = {
  id: string;
  platform: string;
  channelId: string;
  peerId: string;
  platformUserId: string;
  characterChannelSlug: string | null;
  status: "active" | "inactive" | "invalid";
  threadId: string | null;
  agentId: string;
  updatedAt: string | null;
  threadTitle: string | null;
  agentName: string | null;
};

export type ProductChannelPlatformCapability = {
  platform: string;
  availabilityStatus: "active" | "coming_soon" | "disabled";
  supportsBinding: boolean;
  supportsAdvancedIdentityFields: boolean;
  displayOrder: number;
  label: string | null;
};

export type ProductChannelSummary = {
  activeCount: number;
  inactiveCount: number;
  invalidCount: number;
  activePlatforms: string[];
  primaryPlatform: string | null;
  connectionStatus: "connected" | "needs_attention" | "web_only";
};

export type ProductChannelPlatformView = {
  platform: string;
  label: string;
  availabilityStatus: "active" | "coming_soon" | "disabled";
  supportsBinding: boolean;
  supportsAdvancedIdentityFields: boolean;
  activeBinding: ProductChannelBinding | null;
  invalidBindingCount: number;
  inactiveBindingCount: number;
  activeBindingCount: number;
  displayStatus: "connected" | "needs_attention" | "not_connected" | "coming_soon" | "disabled";
  actionMode: "connect" | "rebind" | "unavailable";
};

export type ProductChannelsPageData = {
  workspaceId: string;
  capabilities: ProductChannelPlatformCapability[];
  platforms: ProductChannelPlatformView[];
  bindings: ProductChannelBinding[];
  scopedBindings: ProductChannelBinding[];
  activeBindings: ProductChannelBinding[];
  inactiveBindings: ProductChannelBinding[];
  invalidBindings: ProductChannelBinding[];
  primaryBinding: ProductChannelBinding | null;
  summary: ProductChannelSummary;
};

export const DEFAULT_CHANNEL_PLATFORM_CAPABILITIES: ProductChannelPlatformCapability[] = [
  {
    platform: "telegram",
    availabilityStatus: "active",
    supportsBinding: true,
    supportsAdvancedIdentityFields: true,
    displayOrder: 1,
    label: "Telegram"
  },
  {
    platform: "wechat",
    availabilityStatus: "coming_soon",
    supportsBinding: false,
    supportsAdvancedIdentityFields: false,
    displayOrder: 2,
    label: "WeChat"
  },
  {
    platform: "discord",
    availabilityStatus: "coming_soon",
    supportsBinding: false,
    supportsAdvancedIdentityFields: false,
    displayOrder: 3,
    label: "Discord"
  }
];

type ThreadTitleRow = {
  id: string;
  title: string;
};

type AgentNameRow = {
  id: string;
  name: string;
};

function getMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isTransientSupabaseFetchFailure(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("fetch failed") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("Client network socket disconnected"))
  );
}

export async function loadOwnedChannelBindings(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("channel_bindings")
    .select(
      "id, platform, channel_id, peer_id, platform_user_id, character_channel_slug, status, thread_id, agent_id, updated_at"
    )
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load channel bindings: ${error.message}`);
  }

  const threadIds: string[] = Array.from(
    new Set(
      (data ?? [])
        .map((item: any) => item.thread_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const agentIds: string[] = Array.from(
    new Set(
      (data ?? [])
        .map((item: any) => item.agent_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [{ data: threads }, { data: agents }] = await Promise.all([
    threadIds.length > 0
      ? loadOwnedThreadTitlesByIds({
          supabase: args.supabase,
          threadIds,
          workspaceId: args.workspaceId,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as ThreadTitleRow[] }),
    agentIds.length > 0
      ? loadOwnedActiveAgentsByIds({
          supabase: args.supabase,
          agentIds,
          workspaceId: args.workspaceId,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as AgentNameRow[] })
  ]);

  const threadTitleMap = new Map<string, string>(
    (threads ?? []).map((item: ThreadTitleRow) => [item.id, item.title])
  );
  const agentNameMap = new Map<string, string>(
    (agents ?? []).map((item: AgentNameRow) => [item.id, item.name])
  );

  return (data ?? []).map((item: any) => ({
    id: item.id,
    platform: item.platform,
    channelId: item.channel_id,
    peerId: item.peer_id,
    platformUserId: item.platform_user_id,
    characterChannelSlug:
      typeof item.character_channel_slug === "string"
        ? item.character_channel_slug
        : null,
    status: item.status,
    threadId: item.thread_id ?? null,
    agentId: item.agent_id,
    updatedAt: item.updated_at ?? null,
    threadTitle:
      typeof item.thread_id === "string" ? threadTitleMap.get(item.thread_id) ?? null : null,
    agentName:
      typeof item.agent_id === "string" ? agentNameMap.get(item.agent_id) ?? null : null
  })) as ProductChannelBinding[];
}

export async function loadChannelPlatformCapabilities(args: {
  supabase: any;
}) {
  const { data, error } = await args.supabase
    .from("channel_platform_capabilities")
    .select(
      "platform, availability_status, supports_binding, supports_advanced_identity_fields, display_order, metadata"
    )
    .order("display_order", { ascending: true });

  if (error) {
    return DEFAULT_CHANNEL_PLATFORM_CAPABILITIES;
  }

  const mapped = (data ?? []).map((item: any) => {
    const metadata = getMetadataRecord(item.metadata);

    return {
      platform: item.platform,
      availabilityStatus: item.availability_status,
      supportsBinding: item.supports_binding === true,
      supportsAdvancedIdentityFields: item.supports_advanced_identity_fields === true,
      displayOrder:
        typeof item.display_order === "number" ? item.display_order : 100,
      label: typeof metadata?.label === "string" ? metadata.label : null
    };
  }) as ProductChannelPlatformCapability[];

  return mapped.length > 0 ? mapped : DEFAULT_CHANNEL_PLATFORM_CAPABILITIES;
}

export async function loadChannelPlatformCapability(args: {
  supabase: any;
  platform: string;
}) {
  const platform = args.platform.trim().toLowerCase();
  const capabilities = await loadChannelPlatformCapabilities({
    supabase: args.supabase
  });

  return capabilities.find((item) => item.platform === platform) ?? null;
}

export function summarizeProductChannelBindings(
  bindings: ProductChannelBinding[]
): ProductChannelSummary {
  const activeBindings = bindings.filter((binding) => binding.status === "active");
  const inactiveBindings = bindings.filter((binding) => binding.status === "inactive");
  const invalidBindings = bindings.filter((binding) => binding.status === "invalid");
  const activePlatforms = Array.from(new Set(activeBindings.map((binding) => binding.platform)));

  return {
    activeCount: activeBindings.length,
    inactiveCount: inactiveBindings.length,
    invalidCount: invalidBindings.length,
    activePlatforms,
    primaryPlatform: activePlatforms[0] ?? null,
    connectionStatus:
      activeBindings.length > 0
        ? invalidBindings.length > 0
          ? "needs_attention"
          : "connected"
        : invalidBindings.length > 0
          ? "needs_attention"
          : "web_only"
  };
}

function buildProductChannelPlatformView(args: {
  capability: ProductChannelPlatformCapability;
  bindings: ProductChannelBinding[];
}): ProductChannelPlatformView {
  const platformBindings = args.bindings.filter(
    (binding) => binding.platform.toLowerCase() === args.capability.platform
  );
  const activeBindings = platformBindings.filter((binding) => binding.status === "active");
  const inactiveBindings = platformBindings.filter((binding) => binding.status === "inactive");
  const invalidBindings = platformBindings.filter((binding) => binding.status === "invalid");

  let displayStatus: ProductChannelPlatformView["displayStatus"] = "not_connected";
  if (args.capability.availabilityStatus === "coming_soon") {
    displayStatus = "coming_soon";
  } else if (args.capability.availabilityStatus === "disabled") {
    displayStatus = "disabled";
  } else if (activeBindings.length > 0 && invalidBindings.length > 0) {
    displayStatus = "needs_attention";
  } else if (activeBindings.length > 0) {
    displayStatus = "connected";
  } else if (invalidBindings.length > 0) {
    displayStatus = "needs_attention";
  }

  const actionMode: ProductChannelPlatformView["actionMode"] =
    args.capability.availabilityStatus !== "active" || !args.capability.supportsBinding
      ? "unavailable"
      : activeBindings.length > 0
        ? "rebind"
        : "connect";

  return {
    platform: args.capability.platform,
    label: args.capability.label ?? args.capability.platform,
    availabilityStatus: args.capability.availabilityStatus,
    supportsBinding: args.capability.supportsBinding,
    supportsAdvancedIdentityFields: args.capability.supportsAdvancedIdentityFields,
    activeBinding: activeBindings[0] ?? null,
    invalidBindingCount: invalidBindings.length,
    inactiveBindingCount: inactiveBindings.length,
    activeBindingCount: activeBindings.length,
    displayStatus,
    actionMode
  };
}

export async function updateOwnedChannelBindingStatus(args: {
  supabase: any;
  bindingId: string;
  userId: string;
  status: "active" | "inactive" | "invalid";
  metadataPatch?: Record<string, unknown>;
}) {
  const { data: existingBinding, error: existingError } = await args.supabase
    .from("channel_bindings")
    .select("id, metadata")
    .eq("id", args.bindingId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load channel binding: ${existingError.message}`);
  }

  if (!existingBinding) {
    throw new Error("Channel binding not found.");
  }

  const existingMetadata =
    existingBinding.metadata &&
    typeof existingBinding.metadata === "object" &&
    !Array.isArray(existingBinding.metadata)
      ? (existingBinding.metadata as Record<string, unknown>)
      : {};

  const metadata = args.metadataPatch
    ? {
        ...existingMetadata,
        ...args.metadataPatch
      }
    : existingMetadata;

  const { data, error } = await args.supabase
    .from("channel_bindings")
    .update({
      status: args.status,
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", args.bindingId)
    .eq("user_id", args.userId)
    .select(
      "id, platform, channel_id, peer_id, platform_user_id, status, thread_id, agent_id, updated_at"
    )
    .single();

  if (error) {
    throw new Error(`Failed to update channel binding: ${error.message}`);
  }

  return data;
}

export async function loadProductChannelsPageData(args: {
  supabase: any;
  userId: string;
  roleId?: string | null;
  threadId?: string | null;
}) : Promise<ProductChannelsPageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  let bindings: ProductChannelBinding[] = [];
  let capabilities: ProductChannelPlatformCapability[] = DEFAULT_CHANNEL_PLATFORM_CAPABILITIES;

  try {
    [bindings, capabilities] = await Promise.all([
      loadOwnedChannelBindings({
        supabase: args.supabase,
        workspaceId: workspace.id,
        userId: args.userId
      }),
      loadChannelPlatformCapabilities({
        supabase: args.supabase
      })
    ]);
  } catch (error) {
    if (!isTransientSupabaseFetchFailure(error)) {
      throw error;
    }
  }

  const requestedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0 ? args.roleId : null;
  const requestedThreadId =
    typeof args.threadId === "string" && args.threadId.length > 0 ? args.threadId : null;

  const scopedBindings = bindings.filter((binding) => {
    if (requestedThreadId) {
      return binding.threadId === requestedThreadId;
    }

    if (requestedRoleId) {
      return binding.agentId === requestedRoleId;
    }

    return true;
  });

  const activeBindings = scopedBindings.filter((binding) => binding.status === "active");
  const inactiveBindings = scopedBindings.filter((binding) => binding.status === "inactive");
  const invalidBindings = scopedBindings.filter((binding) => binding.status === "invalid");
  const platforms = capabilities.map((capability) =>
    buildProductChannelPlatformView({
      capability,
      bindings: scopedBindings
    })
  );

  return {
    workspaceId: workspace.id,
    capabilities,
    platforms,
    bindings,
    scopedBindings,
    activeBindings,
    inactiveBindings,
    invalidBindings,
    primaryBinding: activeBindings[0] ?? null,
    summary: summarizeProductChannelBindings(scopedBindings)
  };
}
