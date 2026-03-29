import {
  loadCompletedMessagesForThreads,
  loadOwnedThreads,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import { loadOwnedKnowledgeSourcesForExport } from "@/lib/product/knowledge";
import { loadProductMemoryPageData } from "@/lib/product/memory";
import { loadProductRoleCollection } from "@/lib/product/roles";
import {
  DEFAULT_PRODUCT_APP_SETTINGS,
  DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT,
  loadProductSettingsPageData
} from "@/lib/product/settings";

type ExportUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

export type ProductDataExportPayload = {
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
  };
  workspace: {
    id: string;
    name: string;
    kind: string;
  } | null;
  roles: unknown[];
  threads: unknown[];
  messages: unknown[];
  memory: unknown[];
  channels: unknown[];
  knowledgeSources: unknown[];
  settings: {
    app: unknown;
    subscription: unknown;
  };
};

export async function buildCurrentProductDataExport(args: {
  supabase: any;
  user: ExportUser;
}): Promise<ProductDataExportPayload> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.user.id
  });

  if (!workspace) {
    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: args.user.id,
        email: args.user.email ?? null
      },
      workspace: null,
      roles: [],
      threads: [],
      messages: [],
      memory: [],
      channels: [],
      knowledgeSources: [],
      settings: {
        app: DEFAULT_PRODUCT_APP_SETTINGS,
        subscription: DEFAULT_PRODUCT_SUBSCRIPTION_SNAPSHOT
      }
    };
  }

  const [roleCollection, threadsResult, memoryData, channelBindings, settingsData] =
    await Promise.all([
      loadProductRoleCollection({
        supabase: args.supabase,
        userId: args.user.id
      }),
      loadOwnedThreads({
        supabase: args.supabase,
        workspaceId: workspace.id,
        userId: args.user.id
      }),
      loadProductMemoryPageData({
        supabase: args.supabase,
        userId: args.user.id
      }),
      loadOwnedChannelBindings({
        supabase: args.supabase,
        workspaceId: workspace.id,
        userId: args.user.id
      }),
      loadProductSettingsPageData({
        supabase: args.supabase,
        user: args.user
      })
    ]);

  const threads = threadsResult.data ?? [];
  const threadIds = threads.map((thread: any) => thread.id);
  const [messagesResult, knowledgeSources] = await Promise.all([
    threadIds.length > 0
      ? loadCompletedMessagesForThreads({
          supabase: args.supabase,
          threadIds,
          workspaceId: workspace.id,
          select: "id, thread_id, role, content, status, metadata, created_at"
        })
      : Promise.resolve({ data: [] }),
    loadOwnedKnowledgeSourcesForExport({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.user.id
    })
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: args.user.id,
      email: args.user.email ?? null
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      kind: workspace.kind
    },
    roles: roleCollection?.roles ?? [],
    threads,
    messages: messagesResult.data ?? [],
    memory: memoryData?.items ?? [],
    channels: channelBindings,
    knowledgeSources,
    settings: {
      app: settingsData.appSettings,
      subscription: settingsData.subscription
    }
  };
}

export async function createProductDataExportRecord(args: {
  supabase: any;
  user: ExportUser;
  metadata?: Record<string, unknown>;
}) {
  const payload = await buildCurrentProductDataExport({
    supabase: args.supabase,
    user: args.user
  });

  return args.supabase
    .from("user_data_exports")
    .insert({
      user_id: args.user.id,
      format: "json",
      status: "completed",
      payload,
      metadata: args.metadata ?? {}
    })
    .select("id, created_at")
    .single();
}
