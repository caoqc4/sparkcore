import type {
  LoadThreadStateInput,
  LoadThreadStateResult,
  ThreadStateRecord
} from "@/lib/chat/thread-state";

export type ThreadStateRepository = {
  loadThreadState: (
    input: LoadThreadStateInput
  ) => Promise<LoadThreadStateResult>;
  saveThreadState: (
    record: ThreadStateRecord
  ) => Promise<void>;
};

export class InMemoryThreadStateRepository implements ThreadStateRepository {
  private readonly records: ThreadStateRecord[];

  constructor(records: ThreadStateRecord[] = []) {
    this.records = [...records];
  }

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

  async saveThreadState(record: ThreadStateRecord): Promise<void> {
    const existingIndex = this.records.findIndex(
      (item) =>
        item.thread_id === record.thread_id &&
        item.agent_id === record.agent_id
    );

    if (existingIndex >= 0) {
      this.records.splice(existingIndex, 1, record);
      return;
    }

    this.records.push(record);
  }
}
