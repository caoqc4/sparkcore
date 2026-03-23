import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";

export function buildRuntimeUserMessageMetadata(
  runtimeTurnInput: RuntimeTurnInput
) {
  return {
    source: runtimeTurnInput.message.source,
    runtime_source_timestamp: runtimeTurnInput.message.timestamp,
    adapter_metadata: runtimeTurnInput.message.metadata,
    runtime_turn_input: runtimeTurnInput
  };
}
