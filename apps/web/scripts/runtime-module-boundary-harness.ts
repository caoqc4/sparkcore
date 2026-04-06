import fs from "node:fs/promises";
import path from "node:path";

type BoundaryResult = {
  id: string;
  actual: Record<string, unknown>;
  expected: Record<string, unknown>;
  pass: boolean;
};

type ImportBoundaryRule = {
  id: string;
  relativePath: string;
  allowedImports?: string[];
  forbiddenPrefixes?: string[];
  forbiddenImports?: string[];
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

async function readImports(relativePath: string) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const source = await fs.readFile(absolutePath, "utf8");
  return parseImportSpecifiers(source);
}

async function runRule(rule: ImportBoundaryRule): Promise<BoundaryResult> {
  const imports = await readImports(rule.relativePath);
  const unexpectedImports = rule.allowedImports
    ? imports.filter((specifier) => !rule.allowedImports?.includes(specifier))
    : [];
  const forbiddenMatches = imports.filter(
    (specifier) =>
      rule.forbiddenImports?.includes(specifier) ||
      rule.forbiddenPrefixes?.some((prefix) => specifier.startsWith(prefix))
  );

  return {
    id: rule.id,
    actual: {
      imports,
      unexpected_imports: unexpectedImports,
      forbidden_matches: forbiddenMatches
    },
    expected: {
      unexpected_imports: [],
      forbidden_matches: []
    },
    pass: unexpectedImports.length === 0 && forbiddenMatches.length === 0
  };
}

async function main() {
  const rules: ImportBoundaryRule[] = [
    {
      id: "runtime_entry_import_surface_stays_thin",
      relativePath: "lib/chat/runtime.ts",
      allowedImports: [
        "@/lib/chat/answer-decision",
        "@/lib/chat/memory-shared",
        "@/lib/chat/output-governance",
        "@/lib/chat/role-core",
        "@/lib/chat/runtime-chat-page-state",
        "@/lib/chat/runtime-contract",
        "@/lib/chat/runtime-entry-contracts",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-input",
        "@/lib/chat/runtime-model-profile-resolution",
        "@/lib/chat/runtime-prepared-turn",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-input-validation",
        "@/lib/chat/session-context"
      ]
    },
    {
      id: "answer_decision_stays_pure",
      relativePath: "lib/chat/answer-decision.ts",
      allowedImports: [],
      forbiddenPrefixes: [
        "@/lib/chat/runtime-",
        "@/lib/chat/humanized-delivery-",
        "@/lib/chat/prompt-",
        "@/lib/chat/agent-system-prompt-builders",
        "@/lib/chat/response-surface-prompts",
        "@/lib/chat/memory-prompt-builders",
        "@/lib/chat/layer-prompt-builders"
      ]
    },
    {
      id: "answer_decision_signals_only_depends_on_decision_contract",
      relativePath: "lib/chat/answer-decision-signals.ts",
      allowedImports: ["@/lib/chat/answer-decision"]
    },
    {
      id: "composition_layer_avoids_side_effect_modules",
      relativePath: "lib/chat/runtime-prompt-sections.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-turn-planning",
        "@/lib/chat/runtime-event-builders",
        "@/lib/chat/runtime-observability-builders",
        "@/lib/chat/runtime-turn-observability",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "observability_layer_avoids_model_and_db_ports",
      relativePath: "lib/chat/runtime-observability-builders.ts",
      forbiddenPrefixes: ["@/lib/supabase/", "@/lib/litellm/"]
    },
    {
      id: "generation_context_avoids_side_effect_and_db_ports",
      relativePath: "lib/chat/runtime-generation-context.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-turn-planning",
        "@/lib/chat/runtime-event-builders",
        "@/lib/chat/runtime-observability-builders",
        "@/lib/chat/runtime-turn-observability",
        "@/lib/chat/runtime-humanized-observability",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "post_generation_context_avoids_db_and_direct_side_effect_writes",
      relativePath: "lib/chat/runtime-post-generation-context.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-event-builders",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "side_effect_layer_avoids_prompt_builder_modules",
      relativePath: "lib/chat/runtime-turn-side-effects.ts",
      forbiddenPrefixes: [
        "@/lib/chat/answer-composition-spec",
        "@/lib/chat/agent-system-prompt-builders",
        "@/lib/chat/response-surface-prompts",
        "@/lib/chat/prompt-context-builders",
        "@/lib/chat/memory-prompt-builders",
        "@/lib/chat/layer-prompt-builders",
        "@/lib/chat/runtime-prompt-sections",
        "@/lib/chat/humanized-delivery-prompt"
      ]
    },
    {
      id: "runtime_turn_preparation_avoids_side_effect_and_db_ports",
      relativePath: "lib/chat/runtime-turn-preparation.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-event-builders",
        "@/lib/chat/runtime-observability-builders",
        "@/lib/chat/runtime-turn-observability",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "generate_agent_reply_avoids_decision_and_prompt_builder_backflow",
      relativePath: "lib/chat/runtime-generate-agent-reply.ts",
      forbiddenPrefixes: [
        "@/lib/chat/answer-decision-signals",
        "@/lib/chat/answer-composition-spec",
        "@/lib/chat/runtime-prompt-sections",
        "@/lib/chat/runtime-prompt-preparation",
        "@/lib/chat/humanized-delivery-"
      ]
    },
    {
      id: "prepared_turn_runner_avoids_decision_signal_and_prompt_builder_backflow",
      relativePath: "lib/chat/runtime-prepared-turn-runner.ts",
      forbiddenPrefixes: [
        "@/lib/chat/answer-decision-signals",
        "@/lib/chat/answer-composition-spec",
        "@/lib/chat/agent-system-prompt-builders",
        "@/lib/chat/response-surface-prompts",
        "@/lib/chat/prompt-context-builders",
        "@/lib/chat/memory-prompt-builders",
        "@/lib/chat/layer-prompt-builders"
      ]
    },
    {
      id: "generation_context_avoids_post_generation_and_entry_backflow",
      relativePath: "lib/chat/runtime-generation-context.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation"
      ]
    },
    {
      id: "post_generation_context_avoids_pre_generation_and_entry_backflow",
      relativePath: "lib/chat/runtime-post-generation-context.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation"
      ]
    },
    {
      id: "side_effect_layer_avoids_generation_context_backflow",
      relativePath: "lib/chat/runtime-turn-side-effects.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-turn-preparation"
      ]
    },
    {
      id: "runtime_turn_observability_avoids_entry_runner_and_db_ports",
      relativePath: "lib/chat/runtime-turn-observability.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation",
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "runtime_event_builders_avoid_orchestration_and_external_ports",
      relativePath: "lib/chat/runtime-event-builders.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation",
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/humanized-delivery-",
        "@/lib/chat/prompt-",
        "@/lib/chat/agent-system-prompt-builders",
        "@/lib/chat/response-surface-prompts",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "runtime_prompt_preparation_avoids_orchestration_and_external_ports",
      relativePath: "lib/chat/runtime-prompt-preparation.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation",
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-event-builders",
        "@/lib/chat/runtime-observability-builders",
        "@/lib/chat/runtime-turn-observability",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    },
    {
      id: "runtime_memory_governance_context_avoids_orchestration_and_external_ports",
      relativePath: "lib/chat/runtime-memory-governance-context.ts",
      forbiddenPrefixes: [
        "@/lib/chat/runtime-generation-context",
        "@/lib/chat/runtime-post-generation-context",
        "@/lib/chat/runtime-generate-agent-reply",
        "@/lib/chat/runtime-prepared-turn-runner",
        "@/lib/chat/runtime-turn-preparation",
        "@/lib/chat/runtime-turn-side-effects",
        "@/lib/chat/runtime-event-builders",
        "@/lib/chat/runtime-observability-builders",
        "@/lib/chat/runtime-turn-observability",
        "@/lib/chat/humanized-delivery-",
        "@/lib/chat/prompt-",
        "@/lib/chat/agent-system-prompt-builders",
        "@/lib/chat/response-surface-prompts",
        "@/lib/supabase/",
        "@/lib/litellm/"
      ]
    }
  ];

  const results = await Promise.all(rules.map((rule) => runRule(rule)));
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

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown runtime module boundary harness failure."
  );
  process.exitCode = 1;
});
