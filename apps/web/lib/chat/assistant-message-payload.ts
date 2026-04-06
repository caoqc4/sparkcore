import {
  buildAssistantMessageMetadata,
  type BuildAssistantMessageMetadataInput
} from "@/lib/chat/assistant-message-metadata";

export type BuildRuntimeAssistantPayloadInput = {
  content: string;
  metadata: BuildAssistantMessageMetadataInput;
};

export type RuntimeAssistantPayload = {
  role: "assistant";
  content: string;
  status: "completed";
  metadata: ReturnType<typeof buildAssistantMessageMetadata>;
};

export function buildRuntimeAssistantPayload(
  input: BuildRuntimeAssistantPayloadInput
): RuntimeAssistantPayload {
  return {
    role: "assistant" as const,
    content: input.content,
    status: "completed" as const,
    metadata: buildAssistantMessageMetadata(input.metadata)
  };
}
