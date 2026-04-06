import { approximateTokenCountFromBytes } from "@/lib/chat/runtime-core-helpers";
import type {
  PromptMessage,
  PromptSection,
  PromptSectionLength,
  RuntimePromptPreparation
} from "@/lib/chat/runtime-prompt-contracts";

export type {
  PromptMessage,
  PromptSection,
  PromptSectionLength,
  RuntimePromptPreparation
} from "@/lib/chat/runtime-prompt-contracts";

export function buildRuntimePromptPreparation(args: {
  systemPromptSections: PromptSection[];
  assistantGenerationHint: string | null;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
  }>;
}): RuntimePromptPreparation {
  const systemPrompt = args.systemPromptSections
    .map((section) => section.content)
    .join("\n\n");

  const promptMessages: PromptMessage[] = [
    {
      role: "system",
      content: systemPrompt
    },
    ...(args.assistantGenerationHint
      ? [
          {
            role: "system" as const,
            content: args.assistantGenerationHint
          }
        ]
      : []),
    ...args.messages
      .filter((message) => message.status !== "failed" && message.status !== "pending")
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  ];

  const promptMessageCount = promptMessages.length;
  const promptSystemChars = promptMessages
    .filter((message) => message.role === "system")
    .reduce((total, message) => total + message.content.length, 0);
  const promptUserChars = promptMessages
    .filter((message) => message.role === "user")
    .reduce((total, message) => total + message.content.length, 0);
  const promptAssistantChars = promptMessages
    .filter((message) => message.role === "assistant")
    .reduce((total, message) => total + message.content.length, 0);
  const promptTotalChars = promptMessages.reduce(
    (total, message) => total + message.content.length,
    0
  );
  const promptTotalBytes = Buffer.byteLength(
    JSON.stringify(promptMessages),
    "utf8"
  );
  const promptApproxTokenCount = approximateTokenCountFromBytes(promptTotalBytes);
  const promptSystemSectionLengths = args.systemPromptSections
    .map((section) => ({
      key: section.key,
      chars: section.content.length
    }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 8);

  return {
    systemPrompt,
    promptMessages,
    promptMessageCount,
    promptSystemChars,
    promptUserChars,
    promptAssistantChars,
    promptTotalChars,
    promptTotalBytes,
    promptApproxTokenCount,
    promptSystemSectionLengths
  };
}
