import type {
  RuntimePostGenerationRunnerArtifacts,
  RuntimePostGenerationResolutionArgs
} from "@/lib/chat/runtime-post-generation-contracts";
import { buildRuntimePostGenerationArtifacts } from "@/lib/chat/runtime-post-generation-resolution";

export type {
  RuntimePostGenerationRunnerArtifacts,
  RuntimePostGenerationResolutionArgs
} from "@/lib/chat/runtime-post-generation-contracts";

export async function buildRuntimePostGenerationContext(
  args: RuntimePostGenerationResolutionArgs
): Promise<RuntimePostGenerationRunnerArtifacts> {
  return buildRuntimePostGenerationArtifacts(args);
}
