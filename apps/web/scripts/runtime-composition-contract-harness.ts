import fs from "node:fs/promises";
import path from "node:path";

type HarnessResult = {
  id: string;
  actual: Record<string, unknown>;
  expected: Record<string, unknown>;
  pass: boolean;
};

function parseImportSpecifiers(source: string) {
  const specifiers = new Set<string>();
  const importPattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["'`]([^"'`]+)["'`]/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1]?.trim();
    if (specifier) {
      specifiers.add(specifier);
    }
  }

  return [...specifiers].sort();
}

async function readSource(relativePath: string) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return fs.readFile(absolutePath, "utf8");
}

async function readImports(relativePath: string) {
  const source = await readSource(relativePath);
  return parseImportSpecifiers(source);
}

async function runContractExportRule(args: {
  id: string;
  relativePath: string;
  requiredExports: string[];
}): Promise<HarnessResult> {
  const source = await readSource(args.relativePath);
  const missingExports = args.requiredExports.filter(
    (name) =>
      !source.includes(`export type ${name}`) &&
      !source.includes(`export interface ${name}`) &&
      !source.includes(`export { ${name}`) &&
      !source.includes(`export {\n  ${name}`) &&
      !source.includes(`export const ${name}`)
  );

  return {
    id: args.id,
    actual: {
      file: args.relativePath,
      missing_exports: missingExports
    },
    expected: {
      missing_exports: []
    },
    pass: missingExports.length === 0
  };
}

async function runImportRule(args: {
  id: string;
  relativePath: string;
  requiredImports: string[];
}): Promise<HarnessResult> {
  const imports = await readImports(args.relativePath);
  const missingImports = args.requiredImports.filter(
    (specifier) => !imports.includes(specifier)
  );

  return {
    id: args.id,
    actual: {
      file: args.relativePath,
      imports,
      missing_imports: missingImports
    },
    expected: {
      missing_imports: []
    },
    pass: missingImports.length === 0
  };
}

async function main() {
  const results: HarnessResult[] = await Promise.all([
    runContractExportRule({
      id: "runtime_composition_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-composition-contracts.ts",
      requiredExports: [
        "AnswerCompositionSpec",
        "AnswerInstructionCompositionSpec",
        "AnswerStrategyRelationshipRecallSpec",
        "AnswerStrategyAddressStyleRecallSpec",
        "AnswerStrategyNamingRecallSpec",
        "RuntimeCompositionArtifacts",
        "BuildRuntimeCompositionArtifactsArgs"
      ]
    }),
    runContractExportRule({
      id: "humanized_delivery_contract_exports_stay_complete",
      relativePath: "lib/chat/humanized-delivery-contracts.ts",
      requiredExports: [
        "HumanizedDeliveryPacket",
        "HumanizedDeliveryStrategy",
        "BuildHumanizedDeliveryStrategyArgs",
        "HumanizedRolePresenceQuestionType"
      ]
    }),
    runContractExportRule({
      id: "runtime_system_prompt_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-system-prompt-contracts.ts",
      requiredExports: [
        "AgentSystemPromptRelationshipRecall",
        "AgentSystemPromptSectionsArgs",
        "RuntimePromptSectionsArgs",
        "RuntimePromptSectionsResult"
      ]
    }),
    runContractExportRule({
      id: "runtime_observability_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-observability-contracts.ts",
      requiredExports: [
        "BuildRuntimeObservabilityInputsArgs",
        "RuntimeObservabilityArtifacts",
        "RuntimeObservabilityRelationshipRecallMetadata"
      ]
    }),
    runContractExportRule({
      id: "runtime_contract_exports_include_relationship_memory_summary",
      relativePath: "lib/chat/runtime-contract.ts",
      requiredExports: ["RuntimeRelationshipMemorySummary"]
    }),
    runContractExportRule({
      id: "runtime_close_note_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-close-note-contracts.ts",
      requiredExports: ["RuntimeCloseNoteArtifacts"]
    }),
    runContractExportRule({
      id: "runtime_generation_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-generation-contracts.ts",
      requiredExports: ["PreparedRuntimeGenerationExecutionContext"]
    }),
    runContractExportRule({
      id: "runtime_post_generation_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-post-generation-contracts.ts",
      requiredExports: [
        "RuntimePostGenerationResolutionArgs",
        "BuildRuntimePostGenerationFinalAssistantContentArgs",
        "BuildRuntimePostGenerationArtifactsBundleArgs",
        "RuntimePostGenerationArtifacts",
        "RuntimePostGenerationRunnerArtifacts"
      ]
    }),
    runContractExportRule({
      id: "runtime_turn_observability_contract_exports_stay_complete",
      relativePath: "lib/chat/runtime-turn-observability-contracts.ts",
      requiredExports: [
        "BaseRuntimeTimingArgs",
        "PreparedRuntimeTurnExecutionContext",
        "BuildPreparedRuntimeTurnLogFieldsArgs",
        "BuildGenerateAgentReplyDebugMetadataArgs",
        "BuildGenerateAgentReplyLogFieldsArgs",
        "RuntimeTurnSideEffectsPostGenerationArtifacts",
        "RuntimeTurnSideEffectsExecutionContext"
      ]
    }),
    runImportRule({
      id: "runtime_prompt_contracts_import_humanized_contract_entry",
      relativePath: "lib/chat/runtime-prompt-contracts.ts",
      requiredImports: ["@/lib/chat/humanized-delivery-contracts"]
    }),
    runImportRule({
      id: "runtime_system_prompt_contracts_import_foundational_contract_entries",
      relativePath: "lib/chat/runtime-system-prompt-contracts.ts",
      requiredImports: [
        "@/lib/chat/runtime-composition-contracts",
        "@/lib/chat/humanized-delivery-contracts"
      ]
    }),
    runImportRule({
      id: "runtime_turn_observability_contracts_import_foundational_contract_entries",
      relativePath: "lib/chat/runtime-turn-observability-contracts.ts",
      requiredImports: [
        "@/lib/chat/runtime-prompt-contracts",
        "@/lib/chat/humanized-delivery-contracts"
      ]
    }),
    runImportRule({
      id: "humanized_delivery_builder_imports_contract_entry",
      relativePath: "lib/chat/humanized-delivery-strategy.ts",
      requiredImports: ["@/lib/chat/humanized-delivery-contracts"]
    }),
    runImportRule({
      id: "humanized_delivery_detectors_import_contract_entries",
      relativePath: "lib/chat/humanized-delivery-detectors.ts",
      requiredImports: [
        "@/lib/chat/runtime-composition-contracts",
        "@/lib/chat/humanized-delivery-contracts"
      ]
    }),
    runImportRule({
      id: "answer_strategy_instructions_imports_composition_contract_entry",
      relativePath: "lib/chat/answer-strategy-instructions.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "answer_composition_spec_imports_composition_contract_entry",
      relativePath: "lib/chat/answer-composition-spec.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "prompt_context_builders_import_composition_contract_entry",
      relativePath: "lib/chat/prompt-context-builders.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "memory_recall_prompt_imports_system_prompt_and_composition_contract_entries",
      relativePath: "lib/chat/memory-recall-prompt.ts",
      requiredImports: [
        "@/lib/chat/runtime-system-prompt-contracts",
        "@/lib/chat/answer-composition-spec"
      ]
    }),
    runImportRule({
      id: "memory_prompt_builders_import_runtime_role_and_memory_contract_entries",
      relativePath: "lib/chat/memory-prompt-builders.ts",
      requiredImports: [
        "@/lib/chat/memory-shared",
        "@/lib/chat/role-core"
      ]
    }),
    runImportRule({
      id: "response_surface_prompts_import_prompt_and_humanized_contract_entries",
      relativePath: "lib/chat/response-surface-prompts.ts",
      requiredImports: [
        "@/lib/chat/runtime-prompt-contracts",
        "@/lib/chat/humanized-delivery-contracts"
      ]
    }),
    runImportRule({
      id: "humanized_delivery_packet_imports_composition_and_humanized_contract_entries",
      relativePath: "lib/chat/humanized-delivery-packet.ts",
      requiredImports: [
        "@/lib/chat/runtime-composition-contracts",
        "@/lib/chat/humanized-delivery-contracts"
      ]
    }),
    runImportRule({
      id: "humanized_delivery_prompt_imports_humanized_contract_entry",
      relativePath: "lib/chat/humanized-delivery-prompt.ts",
      requiredImports: ["@/lib/chat/humanized-delivery-contracts"]
    }),
    runImportRule({
      id: "runtime_humanized_observability_imports_humanized_contract_entry",
      relativePath: "lib/chat/runtime-humanized-observability.ts",
      requiredImports: ["@/lib/chat/humanized-delivery-contracts"]
    }),
    runImportRule({
      id: "runtime_assistant_metadata_imports_observability_contract_entry",
      relativePath: "lib/chat/runtime-assistant-metadata.ts",
      requiredImports: ["@/lib/chat/runtime-observability-contracts"]
    }),
    runImportRule({
      id: "runtime_debug_metadata_imports_observability_contract_entry",
      relativePath: "lib/chat/runtime-debug-metadata.ts",
      requiredImports: ["@/lib/chat/runtime-observability-contracts"]
    }),
    runImportRule({
      id: "agent_system_prompt_builders_import_system_prompt_contract_entry",
      relativePath: "lib/chat/agent-system-prompt-builders.ts",
      requiredImports: ["@/lib/chat/runtime-system-prompt-contracts"]
    }),
    runImportRule({
      id: "runtime_prompt_sections_imports_system_prompt_contract_entry",
      relativePath: "lib/chat/runtime-prompt-sections.ts",
      requiredImports: ["@/lib/chat/runtime-system-prompt-contracts"]
    }),
    runImportRule({
      id: "runtime_observability_builder_imports_contract_entry",
      relativePath: "lib/chat/runtime-observability-builders.ts",
      requiredImports: ["@/lib/chat/runtime-observability-contracts"]
    }),
    runImportRule({
      id: "runtime_observability_contracts_import_close_note_contract_entry",
      relativePath: "lib/chat/runtime-observability-contracts.ts",
      requiredImports: ["@/lib/chat/runtime-close-note-contracts"]
    }),
    runImportRule({
      id: "runtime_turn_observability_imports_contract_entry",
      relativePath: "lib/chat/runtime-turn-observability.ts",
      requiredImports: ["@/lib/chat/runtime-turn-observability-contracts"]
    }),
    runImportRule({
      id: "runtime_turn_preparation_imports_runtime_contract_entries",
      relativePath: "lib/chat/runtime-turn-preparation.ts",
      requiredImports: ["@/lib/chat/runtime-contract"]
    }),
    runImportRule({
      id: "runtime_prompt_preparation_imports_prompt_contract_entry",
      relativePath: "lib/chat/runtime-prompt-preparation.ts",
      requiredImports: ["@/lib/chat/runtime-prompt-contracts"]
    }),
    runImportRule({
      id: "runtime_composition_context_imports_composition_contract_entry",
      relativePath: "lib/chat/runtime-composition-context.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "runtime_composition_resolution_imports_contract_entries",
      relativePath: "lib/chat/runtime-composition-resolution.ts",
      requiredImports: [
        "@/lib/chat/runtime-composition-contracts"
      ]
    }),
    runImportRule({
      id: "role_core_imports_composition_contract_entry",
      relativePath: "lib/chat/role-core.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "runtime_prepared_turn_imports_composition_contract_entry",
      relativePath: "lib/chat/runtime-prepared-turn.ts",
      requiredImports: ["@/lib/chat/runtime-composition-contracts"]
    }),
    runImportRule({
      id: "runtime_generation_context_imports_contract_entries",
      relativePath: "lib/chat/runtime-generation-context.ts",
      requiredImports: [
        "@/lib/chat/runtime-generation-contracts",
        "@/lib/chat/runtime-composition-resolution",
        "@/lib/chat/runtime-contract"
      ]
    }),
    runImportRule({
      id: "runtime_prepared_turn_runner_imports_generation_context_entry",
      relativePath: "lib/chat/runtime-prepared-turn-runner.ts",
      requiredImports: ["@/lib/chat/runtime-generation-context"]
    }),
    runImportRule({
      id: "runtime_post_generation_resolution_imports_contract_entries",
      relativePath: "lib/chat/runtime-post-generation-resolution.ts",
      requiredImports: [
        "@/lib/chat/runtime-post-generation-artifacts",
        "@/lib/chat/runtime-post-generation-text",
        "@/lib/chat/runtime-post-generation-contracts"
      ]
    }),
    runImportRule({
      id: "runtime_post_generation_artifacts_imports_contract_entries",
      relativePath: "lib/chat/runtime-post-generation-artifacts.ts",
      requiredImports: [
        "@/lib/chat/runtime-post-generation-contracts"
      ]
    }),
    runImportRule({
      id: "runtime_post_generation_text_imports_contract_entries",
      relativePath: "lib/chat/runtime-post-generation-text.ts",
      requiredImports: [
        "@/lib/chat/runtime-post-generation-contracts"
      ]
    }),
    runImportRule({
      id: "runtime_post_generation_context_imports_contract_entries",
      relativePath: "lib/chat/runtime-post-generation-context.ts",
      requiredImports: [
        "@/lib/chat/runtime-post-generation-contracts",
        "@/lib/chat/runtime-post-generation-resolution"
      ]
    }),
    runImportRule({
      id: "runtime_turn_side_effects_imports_turn_observability_contract_entry",
      relativePath: "lib/chat/runtime-turn-side-effects.ts",
      requiredImports: ["@/lib/chat/runtime-turn-observability-contracts"]
    })
  ]);

  const failed = results.filter((result) => !result.pass);
  console.log(
    JSON.stringify(
      {
        status: failed.length === 0 ? "ok" : "failed",
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        results
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main();
