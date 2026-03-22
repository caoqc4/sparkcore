import {
  loadRuntimeMemoryContext,
  type RuntimeMemoryContext
} from "@/lib/chat/memory-recall";
import {
  buildRoleCorePacket,
  type AgentRecord,
  type ReplyLanguageSource,
  type RoleCorePacket,
  type RuntimeReplyLanguage
} from "@/lib/chat/role-core";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  buildSessionContext,
  type SessionContext,
  type SessionReplyLanguage
} from "@/lib/chat/session-context";
import { buildDefaultThreadState } from "@/lib/chat/thread-state";

export type PreparedRuntimeWorkspace = {
  id: string;
  name: string;
  kind: string;
};

export type PreparedRuntimeThread = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PreparedRuntimeMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PreparedRuntimeTurn = {
  input: RuntimeTurnInput;
  role: {
    agent: AgentRecord;
    role_core: RoleCorePacket;
  };
  session: SessionContext;
  memory: {
    runtime_memory_context: RuntimeMemoryContext;
  };
  resources: {
    workspace: PreparedRuntimeWorkspace;
    thread: PreparedRuntimeThread;
    messages: PreparedRuntimeMessage[];
    assistant_message_id?: string;
    supabase?: unknown;
  };
};

export function buildPreparedRuntimeTurn(args: {
  input: RuntimeTurnInput;
  agent: AgentRecord;
  roleCorePacket: RoleCorePacket;
  session: SessionContext;
  runtimeMemoryContext: RuntimeMemoryContext;
  workspace: PreparedRuntimeWorkspace;
  thread: PreparedRuntimeThread;
  messages: PreparedRuntimeMessage[];
  assistantMessageId?: string;
  supabase?: unknown;
}): PreparedRuntimeTurn {
  return {
    input: args.input,
    role: {
      agent: args.agent,
      role_core: args.roleCorePacket
    },
    session: args.session,
    memory: {
      runtime_memory_context: args.runtimeMemoryContext
    },
    resources: {
      workspace: args.workspace,
      thread: args.thread,
      messages: args.messages,
      assistant_message_id: args.assistantMessageId,
      supabase: args.supabase
    }
  };
}

export function prepareRuntimeSession(args: {
  thread: PreparedRuntimeThread;
  agent: AgentRecord;
  messages: PreparedRuntimeMessage[];
  detectReplyLanguageFromText: (content: string) => SessionReplyLanguage;
  isReplyLanguage: (value: unknown) => value is SessionReplyLanguage;
  getDeveloperDiagnosticsMetadata: (
    metadata: Record<string, unknown> | null | undefined
  ) => Record<string, unknown> | null;
}): SessionContext {
  const latestUserMessage = [...args.messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestAssistantMessage = [...args.messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" && message.status === "completed"
    );

  return buildSessionContext({
    threadId: args.thread.id,
    agentId: args.agent.id,
    messages: args.messages,
    threadState: buildDefaultThreadState({
      threadId: args.thread.id,
      agentId: args.agent.id,
      lastUserMessageId: latestUserMessage?.id ?? null,
      lastAssistantMessageId: latestAssistantMessage?.id ?? null
    }),
    detectReplyLanguageFromText: args.detectReplyLanguageFromText,
    isReplyLanguage: args.isReplyLanguage,
    getDeveloperDiagnosticsMetadata: args.getDeveloperDiagnosticsMetadata
  });
}

export function prepareRuntimeRole(args: {
  agent: AgentRecord;
  replyLanguage: RuntimeReplyLanguage;
  replyLanguageSource: ReplyLanguageSource;
  preferSameThreadContinuation: boolean;
  relationshipRecall: {
    addressStyleMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  };
}): RoleCorePacket {
  return buildRoleCorePacket({
    agent: args.agent,
    replyLanguage: args.replyLanguage,
    replyLanguageSource: args.replyLanguageSource,
    preferSameThreadContinuation: args.preferSameThreadContinuation,
    relationshipRecall: args.relationshipRecall
  });
}

export async function prepareRuntimeMemory(args: {
  workspaceId: string;
  userId: string;
  agentId: string;
  threadId: string;
  latestUserMessage: string | null;
  preferSameThreadContinuation: boolean;
  sameThreadContinuity: boolean;
  relationshipStylePrompt: boolean;
  supabase?: any;
}): Promise<RuntimeMemoryContext> {
  return loadRuntimeMemoryContext({
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    threadId: args.threadId,
    latestUserMessage: args.latestUserMessage,
    preferSameThreadContinuation: args.preferSameThreadContinuation,
    sameThreadContinuity: args.sameThreadContinuity,
    relationshipStylePrompt: args.relationshipStylePrompt,
    supabase: args.supabase
  });
}

export async function prepareRuntimeTurn(args: {
  input: RuntimeTurnInput;
  agent: AgentRecord;
  roleCorePacket: RoleCorePacket;
  session: SessionContext;
  runtimeMemoryContext: RuntimeMemoryContext;
  workspace: PreparedRuntimeWorkspace;
  thread: PreparedRuntimeThread;
  messages: PreparedRuntimeMessage[];
  assistantMessageId?: string;
  supabase?: unknown;
}): Promise<PreparedRuntimeTurn> {
  return buildPreparedRuntimeTurn(args);
}
