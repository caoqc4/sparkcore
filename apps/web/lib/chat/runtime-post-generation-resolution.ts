import { buildRuntimePostGenerationArtifactsBundle } from "@/lib/chat/runtime-post-generation-artifacts";
import type {
  RuntimePostGenerationResolutionArgs,
  RuntimePostGenerationRunnerArtifacts
} from "@/lib/chat/runtime-post-generation-contracts";
import { buildRuntimePostGenerationFinalAssistantContent } from "@/lib/chat/runtime-post-generation-text";

export async function buildRuntimePostGenerationArtifacts(
  args: RuntimePostGenerationResolutionArgs
): Promise<RuntimePostGenerationRunnerArtifacts> {
  const finalAssistantContent =
    buildRuntimePostGenerationFinalAssistantContent(args);
  const runtimePostGenerationArtifacts =
    await buildRuntimePostGenerationArtifactsBundle({
      ...args,
      finalAssistantContent
    });

  return runtimePostGenerationArtifacts;
}
