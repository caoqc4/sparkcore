import type { RuntimeMemoryContext } from "@/lib/chat/memory-recall";
import type { AgentRecord, RoleCorePacket } from "@/lib/chat/role-core";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import type { SessionContext } from "@/lib/chat/session-context";

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
