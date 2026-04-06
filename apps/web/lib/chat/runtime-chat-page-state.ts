import { getMemoryStatus, isMemoryHidden, isMemoryIncorrect, isMemoryScopeValid } from "@/lib/chat/memory-v2";
import { buildVisibleMemoryRecord, type HiddenMemoryRecord, type IncorrectMemoryRecord, type SupersededMemoryRecord, type VisibleMemoryRecord } from "@/lib/chat/memory-visible-records";
import { getModelProfileTierLabel, getModelProfileUsageNote, getUnderlyingModelLabel } from "@/lib/chat/model-profile-metadata";
import { buildMessagePreview, summarizeAgentPrompt } from "@/lib/chat/runtime-orchestration-helpers";
import { resolveAgentForWorkspace } from "@/lib/chat/runtime-agent-resolution";
import { resolveRuntimePageUserWithSmokeFallback, retryRuntimePageLoadInSmokeMode } from "@/lib/chat/runtime-page-context";
import {
  bindOwnedThreadAgent,
  createOwnedThread,
  loadActiveModelProfiles,
  loadActivePersonaPacks,
  loadCompletedMessagesForThreads,
  loadLatestOwnedThread,
  loadModelProfilesByIds,
  loadOwnedActiveAgentsByIds,
  loadOwnedAvailableAgents,
  loadOwnedThreadTitlesByIds,
  loadOwnedThreads,
  loadPersonaPackNamesByIds,
  loadPrimaryWorkspace,
  loadRecentOwnedMemories,
  loadSourceMessagesByIds
} from "@/lib/chat/runtime-turn-context";
import type { AgentRecord } from "@/lib/chat/role-core";
import { SupabaseRoleRepository } from "@/lib/chat/role-repository";
import { resolveRoleProfile } from "@/lib/chat/role-service";
import { createClient } from "@/lib/supabase/server";
import { loadThreadMessages } from "@/lib/chat/message-read";

export type WorkspaceRecord = {
  id: string;
  name: string;
  kind: string;
};

export type ThreadRecord = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ThreadListItem = ThreadRecord & {
  agent_name: string | null;
  latest_message_preview: string | null;
  latest_message_created_at: string | null;
};

export type AvailableAgentRecord = {
  id: string;
  name: string;
  is_custom: boolean;
  persona_summary: string;
  background_summary: string | null;
  avatar_emoji: string | null;
  system_prompt_summary: string;
  source_persona_pack_id: string | null;
  default_model_profile_id: string | null;
  source_persona_pack_name: string | null;
  default_model_profile_name: string | null;
  default_model_profile_tier_label: string | null;
  is_default_for_workspace: boolean;
};

export type AvailablePersonaPackRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

export type AvailableModelProfileRecord = {
  id: string;
  name: string;
  provider: string;
  model: string;
  metadata: Record<string, unknown>;
  tier_label: string | null;
  usage_note: string | null;
  underlying_model: string | null;
};

export type RequestedThreadFallback = {
  requestedThreadId: string;
  reasonCode: "invalid_or_unauthorized";
};

export async function getChatState() {
  return retryRuntimePageLoadInSmokeMode({
    label: "chat state",
    task: async () => {
      const initialSupabase = await createClient();
      const { supabase, user } =
        await resolveRuntimePageUserWithSmokeFallback(initialSupabase);

      if (!user) {
        return null;
      }

      const { data: workspace } = await loadPrimaryWorkspace({
        supabase,
        userId: user.id
      });

      if (!workspace) {
        return {
          user,
          workspace: null,
          thread: null,
          agent: null,
          messages: []
        };
      }

      let { data: thread } = await loadLatestOwnedThread({
        supabase,
        workspaceId: workspace.id,
        userId: user.id
      });

      let agent: AgentRecord | null = null;

      if (thread?.agent_id) {
        const roleResolution = await resolveRoleProfile({
          repository: new SupabaseRoleRepository(supabase),
          workspaceId: workspace.id,
          userId: user.id,
          requestedAgentId: thread.agent_id
        });

        if (roleResolution.status === "resolved") {
          agent = roleResolution.role;
        }
      }

      if (!agent) {
        agent = await resolveAgentForWorkspace({
          workspaceId: workspace.id,
          userId: user.id
        });

        if (!thread) {
          const { data: createdThread, error } = await createOwnedThread({
            supabase,
            workspaceId: workspace.id,
            userId: user.id,
            agentId: agent.id,
            title: "New chat"
          });

          if (error || !createdThread) {
            throw new Error(
              `Failed to create default chat thread: ${error?.message ?? "unknown error"}`
            );
          }

          thread = createdThread;
        } else {
          const { data: updatedThread, error } = await bindOwnedThreadAgent({
            supabase,
            threadId: thread.id,
            userId: user.id,
            agentId: agent.id
          });

          if (error || !updatedThread) {
            throw new Error(
              `Failed to bind thread to the default agent: ${error?.message ?? "unknown error"}`
            );
          }

          thread = updatedThread;
        }
      }

      if (!thread) {
        throw new Error("Thread resolution failed for the current workspace.");
      }

      const { data: messages, error: messagesError } = await loadThreadMessages({
        supabase,
        threadId: thread.id,
        workspaceId: workspace.id
      });

      if (messagesError) {
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }

      return {
        user,
        workspace: workspace as WorkspaceRecord,
        thread: thread as ThreadRecord,
        agent,
        messages: (messages ?? []) as MessageRecord[]
      };
    }
  });
}

export async function getChatPageState({
  requestedThreadId
}: {
  requestedThreadId?: string;
}) {
  return retryRuntimePageLoadInSmokeMode({
    label: "chat page state",
    task: async () => {
      const initialSupabase = await createClient();
      const { supabase, user } =
        await resolveRuntimePageUserWithSmokeFallback(initialSupabase);

      if (!user) {
        return null;
      }

      const { data: workspace } = await loadPrimaryWorkspace({
        supabase,
        userId: user.id
      });

      if (!workspace) {
        return {
          user,
          workspace: null,
          availablePersonaPacks: [],
          availableModelProfiles: [],
          availableAgents: [],
          defaultAgentId: null,
          visibleMemories: [],
          hiddenMemories: [],
          incorrectMemories: [],
          supersededMemories: [],
          threads: [],
          thread: null,
          agent: null,
          messages: [],
          canonicalThreadId: null,
          shouldReplaceUrl: false,
          requestedThreadFallback: null as RequestedThreadFallback | null
        };
      }

      const { data: rawThreads, error: threadsError } = await loadOwnedThreads({
        supabase,
        workspaceId: workspace.id,
        userId: user.id
      });

      if (threadsError) {
        throw new Error(`Failed to load threads: ${threadsError.message}`);
      }

      const { data: personaPacksData, error: personaPacksError } =
        await loadActivePersonaPacks({ supabase });

      if (personaPacksError) {
        throw new Error(
          `Failed to load available persona packs: ${personaPacksError.message}`
        );
      }

      const { data: availableAgentsData, error: availableAgentsError } =
        await loadOwnedAvailableAgents({
          supabase,
          workspaceId: workspace.id,
          userId: user.id
        });

      if (availableAgentsError) {
        throw new Error(
          `Failed to load available agents: ${availableAgentsError.message}`
        );
      }

      const { data: availableModelProfilesData, error: availableModelProfilesError } =
        await loadActiveModelProfiles({ supabase });

      if (availableModelProfilesError) {
        throw new Error(
          `Failed to load available model profiles: ${availableModelProfilesError.message}`
        );
      }

      const { data: visibleMemoriesData, error: visibleMemoriesError } =
        await loadRecentOwnedMemories({
          supabase,
          workspaceId: workspace.id,
          userId: user.id,
          limit: 60
        });

      if (visibleMemoriesError) {
        throw new Error(
          `Failed to load visible memories: ${visibleMemoriesError.message}`
        );
      }

      const rawAvailableAgents = (availableAgentsData ?? []) as Array<{
        id: string;
        name: string;
        is_custom: boolean;
        persona_summary: string;
        system_prompt: string;
        source_persona_pack_id: string | null;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      }>;
      const personaPackIds = [
        ...new Set(
          rawAvailableAgents
            .map((agent) => agent.source_persona_pack_id)
            .filter((id): id is string => Boolean(id))
        )
      ];
      const modelProfileIds = [
        ...new Set(
          rawAvailableAgents
            .map((agent) => agent.default_model_profile_id)
            .filter((id): id is string => Boolean(id))
        )
      ];
      const rawVisibleMemories = (visibleMemoriesData ?? []) as Array<{
        id: string;
        memory_type: string | null;
        category?: string | null;
        key?: string | null;
        value?: unknown;
        scope?: string | null;
        subject_user_id?: string | null;
        target_agent_id?: string | null;
        target_thread_id?: string | null;
        stability?: string | null;
        status?: string | null;
        source_refs?: unknown;
        content: string;
        confidence: number;
        metadata: Record<string, unknown>;
        source_message_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      const validVisibleMemories = rawVisibleMemories.filter((memory) =>
        isMemoryScopeValid(memory)
      );
      const filteredVisibleMemories = validVisibleMemories
        .filter((memory) => !isMemoryHidden(memory) && !isMemoryIncorrect(memory))
        .slice(0, 20);
      const filteredHiddenMemories = validVisibleMemories
        .filter((memory) => isMemoryHidden(memory) && !isMemoryIncorrect(memory))
        .slice(0, 20);
      const filteredIncorrectMemories = validVisibleMemories
        .filter((memory) => isMemoryIncorrect(memory))
        .slice(0, 20);
      const filteredSupersededMemories = validVisibleMemories
        .filter(
          (memory) =>
            !isMemoryHidden(memory) &&
            !isMemoryIncorrect(memory) &&
            getMemoryStatus(memory) === "superseded"
        )
        .slice(0, 20);
      const sourceMessageIds = [
        ...new Set(
          [
            ...filteredVisibleMemories,
            ...filteredHiddenMemories,
            ...filteredIncorrectMemories,
            ...filteredSupersededMemories
          ]
            .map((memory) => memory.source_message_id)
            .filter((id): id is string => Boolean(id))
        )
      ];
      let personaPackNameById = new Map<string, string>();
      let modelProfileNameById = new Map<string, string>();
      let modelProfileTierLabelById = new Map<string, string>();
      let sourceMessageById = new Map<string, { thread_id: string; created_at: string }>();
      let sourceThreadTitleById = new Map<string, string>();

      if (personaPackIds.length > 0) {
        const { data: personaPacks, error: loadPersonaPacksError } =
          await loadPersonaPackNamesByIds({
            supabase,
            personaPackIds
          });

        if (loadPersonaPacksError) {
          throw new Error(
            `Failed to load agent persona packs: ${loadPersonaPacksError.message}`
          );
        }

        const typedPersonaPacks = (personaPacks ?? []) as Array<{
          id: string;
          name: string;
        }>;

        personaPackNameById = new Map(
          typedPersonaPacks.map((personaPack) => [personaPack.id, personaPack.name])
        );
      }

      if (modelProfileIds.length > 0) {
        const { data: modelProfiles, error: modelProfilesError } =
          await loadModelProfilesByIds({
            supabase,
            modelProfileIds
          });

        if (modelProfilesError) {
          throw new Error(
            `Failed to load agent model profiles: ${modelProfilesError.message}`
          );
        }

        const typedModelProfiles = (modelProfiles ?? []) as Array<{
          id: string;
          name: string;
          metadata: Record<string, unknown> | null;
        }>;

        modelProfileNameById = new Map(
          typedModelProfiles.map((modelProfile) => [modelProfile.id, modelProfile.name])
        );
        modelProfileTierLabelById = new Map();

        for (const modelProfile of typedModelProfiles) {
          const tierLabel = getModelProfileTierLabel(modelProfile.metadata);
          if (tierLabel !== null) {
            modelProfileTierLabelById.set(modelProfile.id, tierLabel);
          }
        }
      }

      if (sourceMessageIds.length > 0) {
        const { data: sourceMessages, error: sourceMessagesError } =
          await loadSourceMessagesByIds({
            supabase,
            sourceMessageIds,
            workspaceId: workspace.id
          });

        if (sourceMessagesError) {
          throw new Error(
            `Failed to load memory source messages: ${sourceMessagesError.message}`
          );
        }

        const typedSourceMessages = (sourceMessages ?? []) as Array<{
          id: string;
          thread_id: string;
          created_at: string;
        }>;

        sourceMessageById = new Map(
          typedSourceMessages.map((message) => [
            message.id,
            {
              thread_id: message.thread_id,
              created_at: message.created_at
            }
          ])
        );

        const sourceThreadIds = [...new Set(typedSourceMessages.map((message) => message.thread_id))];

        if (sourceThreadIds.length > 0) {
          const { data: sourceThreads, error: sourceThreadsError } =
            await loadOwnedThreadTitlesByIds({
              supabase,
              threadIds: sourceThreadIds,
              workspaceId: workspace.id,
              userId: user.id
            });

          if (sourceThreadsError) {
            throw new Error(
              `Failed to load memory source threads: ${sourceThreadsError.message}`
            );
          }

          const typedSourceThreads = (sourceThreads ?? []) as Array<{
            id: string;
            title: string;
          }>;

          sourceThreadTitleById = new Map(
            typedSourceThreads.map((thread) => [thread.id, thread.title])
          );
        }
      }

      const availableAgents = rawAvailableAgents.map((agent) => ({
        ...agent,
        persona_summary: agent.persona_summary,
        background_summary:
          typeof agent.metadata?.background_summary === "string" &&
          agent.metadata.background_summary.trim().length > 0
            ? agent.metadata.background_summary
            : null,
        avatar_emoji:
          typeof agent.metadata?.avatar_emoji === "string" &&
          agent.metadata.avatar_emoji.trim().length > 0
            ? agent.metadata.avatar_emoji
            : null,
        system_prompt_summary: summarizeAgentPrompt(agent.system_prompt),
        source_persona_pack_name: agent.source_persona_pack_id
          ? personaPackNameById.get(agent.source_persona_pack_id) ?? null
          : null,
        default_model_profile_name: agent.default_model_profile_id
          ? modelProfileNameById.get(agent.default_model_profile_id) ?? null
          : null,
        default_model_profile_tier_label: agent.default_model_profile_id
          ? modelProfileTierLabelById.get(agent.default_model_profile_id) ?? null
          : null,
        is_default_for_workspace: agent.metadata?.is_default_for_workspace === true
      })) as AvailableAgentRecord[];
      const defaultAgentId =
        availableAgents.find((agent) => agent.is_default_for_workspace)?.id ??
        availableAgents[0]?.id ??
        null;
      const agentNameById = new Map(availableAgents.map((agent) => [agent.id, agent.name]));
      const availablePersonaPacks = (personaPacksData ?? []) as AvailablePersonaPackRecord[];
      const availableModelProfiles = ((availableModelProfilesData ?? []) as Array<{
        id: string;
        name: string;
        provider: string;
        model: string;
        metadata: Record<string, unknown> | null;
      }>).map((modelProfile) => ({
        ...modelProfile,
        metadata: modelProfile.metadata ?? {},
        tier_label: getModelProfileTierLabel(modelProfile.metadata),
        usage_note: getModelProfileUsageNote(modelProfile.metadata),
        underlying_model: getUnderlyingModelLabel(modelProfile.metadata)
      })) as AvailableModelProfileRecord[];
      const visibleMemories = filteredVisibleMemories.map((memory) =>
        buildVisibleMemoryRecord({
          memory,
          agentNameById,
          sourceMessageById,
          sourceThreadTitleById
        })
      ) as VisibleMemoryRecord[];
      const hiddenMemories = filteredHiddenMemories.map((memory) =>
        buildVisibleMemoryRecord({
          memory,
          agentNameById,
          sourceMessageById,
          sourceThreadTitleById
        })
      ) as HiddenMemoryRecord[];
      const incorrectMemories = filteredIncorrectMemories.map((memory) =>
        buildVisibleMemoryRecord({
          memory,
          agentNameById,
          sourceMessageById,
          sourceThreadTitleById
        })
      ) as IncorrectMemoryRecord[];
      const supersededMemories = filteredSupersededMemories.map((memory) =>
        buildVisibleMemoryRecord({
          memory,
          agentNameById,
          sourceMessageById,
          sourceThreadTitleById
        })
      ) as SupersededMemoryRecord[];
      const threads = (rawThreads ?? []) as ThreadRecord[];

      if (threads.length === 0) {
        return {
          user,
          workspace: workspace as WorkspaceRecord,
          availablePersonaPacks,
          availableModelProfiles,
          availableAgents,
          defaultAgentId,
          visibleMemories,
          hiddenMemories,
          incorrectMemories,
          supersededMemories,
          threads: [],
          thread: null,
          agent: null,
          messages: [],
          canonicalThreadId: null,
          shouldReplaceUrl: false,
          requestedThreadFallback: requestedThreadId
            ? ({
                requestedThreadId,
                reasonCode: "invalid_or_unauthorized"
              } satisfies RequestedThreadFallback)
            : null
        };
      }

      const agentIds = [
        ...new Set(
          threads
            .map((thread) => thread.agent_id)
            .filter((agentId): agentId is string => typeof agentId === "string")
        )
      ];
      let agentById = new Map<string, AgentRecord>();
      let latestMessageByThreadId = new Map<string, { content: string; created_at: string }>();

      if (agentIds.length > 0) {
        const { data: agents, error: agentsError } = await loadOwnedActiveAgentsByIds({
          supabase,
          agentIds,
          workspaceId: workspace.id,
          userId: user.id
        });

        if (agentsError) {
          throw new Error(`Failed to load thread agents: ${agentsError.message}`);
        }

        agentById = new Map(
          ((agents ?? []) as AgentRecord[]).map((agent) => [agent.id, agent])
        );
      }

      if (threads.length > 0) {
        const threadIds = threads.map((thread) => thread.id);
        const { data: latestMessages, error: latestMessagesError } =
          await loadCompletedMessagesForThreads({
            supabase,
            threadIds,
            workspaceId: workspace.id
          });

        if (latestMessagesError) {
          throw new Error(
            `Failed to load thread previews: ${latestMessagesError.message}`
          );
        }

        latestMessageByThreadId = new Map();

        for (const message of latestMessages ?? []) {
          if (!latestMessageByThreadId.has(message.thread_id)) {
            latestMessageByThreadId.set(message.thread_id, {
              content: message.content,
              created_at: message.created_at
            });
          }
        }
      }

      const threadItems: ThreadListItem[] = threads.map((thread) => ({
        ...thread,
        agent_name: thread.agent_id ? agentById.get(thread.agent_id)?.name ?? null : null,
        latest_message_preview: latestMessageByThreadId.get(thread.id)
          ? buildMessagePreview(latestMessageByThreadId.get(thread.id)!.content)
          : null,
        latest_message_created_at:
          latestMessageByThreadId.get(thread.id)?.created_at ?? null
      }));

      const matchedThread = requestedThreadId
        ? threadItems.find((thread) => thread.id === requestedThreadId) ?? null
        : null;
      const activeThread = matchedThread ?? threadItems[0];
      const requestedThreadFallback =
        requestedThreadId && !matchedThread
          ? ({
              requestedThreadId,
              reasonCode: "invalid_or_unauthorized"
            } satisfies RequestedThreadFallback)
          : null;
      const shouldReplaceUrl =
        Boolean(activeThread) && activeThread.id !== (requestedThreadId ?? null);
      const activeAgent =
        activeThread?.agent_id ? agentById.get(activeThread.agent_id) ?? null : null;

      const { data: messages, error: messagesError } = await loadThreadMessages({
        supabase,
        threadId: activeThread.id,
        workspaceId: workspace.id
      });

      if (messagesError) {
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }

      return {
        user,
        workspace: workspace as WorkspaceRecord,
        availablePersonaPacks,
        availableModelProfiles,
        availableAgents,
        defaultAgentId,
        visibleMemories,
        hiddenMemories,
        incorrectMemories,
        supersededMemories,
        threads: threadItems,
        thread: activeThread,
        agent: activeAgent,
        messages: (messages ?? []) as MessageRecord[],
        canonicalThreadId: activeThread.id,
        shouldReplaceUrl,
        requestedThreadFallback
      };
    }
  });
}
