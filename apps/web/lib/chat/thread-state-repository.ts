import type {
  LoadThreadStateInput,
  LoadThreadStateResult,
  ThreadStateRecord
} from "@/lib/chat/thread-state";

export type ThreadStateRepository = {
  loadThreadState: (
    input: LoadThreadStateInput
  ) => Promise<LoadThreadStateResult>;
};

export class InMemoryThreadStateRepository implements ThreadStateRepository {
  constructor(
    private readonly records: ThreadStateRecord[] = []
  ) {}

  async loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult> {
    const record =
      this.records.find(
        (item) =>
          item.thread_id === input.threadId &&
          item.agent_id === input.agentId
      ) ?? null;

    if (!record) {
      return {
        status: "not_found"
      };
    }

    return {
      status: "found",
      thread_state: record
    };
  }
}
