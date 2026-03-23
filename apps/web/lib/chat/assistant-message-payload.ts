import {
  buildAssistantMessageMetadata,
  type BuildAssistantMessageMetadataInput
} from "@/lib/chat/assistant-message-metadata";

export type BuildRuntimeAssistantPayloadInput = {
  content: string;
  metadata: BuildAssistantMessageMetadataInput;
};

export function buildRuntimeAssistantPayload(
  input: BuildRuntimeAssistantPayloadInput
) {
  return {
    role: "assistant" as const,
    content: input.content,
    status: "completed" as const,
    metadata: buildAssistantMessageMetadata(input.metadata)
  };
}
