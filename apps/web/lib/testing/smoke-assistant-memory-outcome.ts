export function buildSmokeAssistantMemoryOutcome(args: {
  recalledMemories: Array<{
    memory_type: string | null;
    content: string;
    confidence: number | null;
  }>;
  createdTypes: string[];
}) {
  return {
    recalled_memories: args.recalledMemories.map((memory) => ({
      memory_type: memory.memory_type,
      content: memory.content,
      confidence: memory.confidence
    })),
    memory_write_count: args.createdTypes.length,
    memory_write_types: args.createdTypes,
    new_memory_count: args.createdTypes.length,
    updated_memory_count: 0
  };
}
