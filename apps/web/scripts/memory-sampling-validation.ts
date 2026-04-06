import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { loadLocalEnv } from "./load-local-env";

type ValidationStep = {
  id: string;
  label: string;
  command: string;
  args: string[];
  description: string;
};

type ValidationStepResult = {
  id: string;
  label: string;
  description: string;
  command: string;
  durationMs: number;
  stdout: string;
};

const VALIDATION_STEPS: ValidationStep[] = [
  {
    id: "stage_regression_full",
    label: "Stage regression",
    command: "pnpm",
    args: ["run", "memory:stage-regression:full"],
    description:
      "Confirm relationship, recall, knowledge, thread_state, planner, and smoke regressions are all green before sampling."
  },
  {
    id: "runtime_role_presence_smoke",
    label: "Real runtime role presence smoke",
    command: "pnpm",
    args: [
      "exec",
      "playwright",
      "test",
      "tests/smoke/runtime-centralization.spec.ts",
      "-g",
      "web chat sends through real runtime and persists governance metadata|web chat keeps role background and persona anchors visible on the real runtime path",
      "--reporter=line"
    ],
    description:
      "Validate the real runtime path keeps governance metadata and role-presence anchors visible."
  },
  {
    id: "knowledge_selection_report",
    label: "Knowledge sampling buckets",
    command: "pnpm",
    args: ["run", "memory:knowledge-selection:report"],
    description:
      "Bucket knowledge cases into relational, light task, domain task, artifact lookup, and route-suppressed groups."
  },
  {
    id: "planner_summary_report",
    label: "Planner sampling buckets",
    command: "pnpm",
    args: ["run", "memory:planner-summary:report"],
    description:
      "Bucket planner cases into profile/relationship, boundary, event-only, and generic reject groups."
  }
];

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${(durationMs / 60_000).toFixed(1)}m`;
}

async function runStep(
  step: ValidationStep,
  cwd: string
): Promise<ValidationStepResult> {
  const startedAt = Date.now();

  return await new Promise<ValidationStepResult>((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(step.command, step.args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `${step.id} failed with exit code ${code ?? 1}\n${
              stderr.trim() || stdout.trim()
            }`
          )
        );
        return;
      }

      resolve({
        id: step.id,
        label: step.label,
        description: step.description,
        command: `${step.command} ${step.args.join(" ")}`,
        durationMs: Date.now() - startedAt,
        stdout: stdout.trim()
      });
    });
  });
}

function renderMarkdown(results: ValidationStepResult[]) {
  const lines: string[] = [
    "# Memory Sampling Validation Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    ""
  ];

  for (const result of results) {
    lines.push(`## ${result.label}`);
    lines.push("");
    lines.push(`- Description: ${result.description}`);
    lines.push(`- Command: \`${result.command}\``);
    lines.push(`- Duration: ${formatDuration(result.durationMs)}`);
    lines.push("");
    lines.push("```text");
    lines.push(result.stdout || "(no stdout)");
    lines.push("```");
    lines.push("");
  }

  lines.push("## Manual Review Buckets");
  lines.push("");
  lines.push(
    "- Relationship turns: check whether naming, closeness, and self-introduction preserve the role's core persona instead of becoming generic companion phrasing."
  );
  lines.push(
    "- Knowledge turns: compare `available / should_inject / count / injection_gap_reason` before judging reply quality."
  );
  lines.push(
    "- Thread-state turns: sample one task projection, one subtask refinement, and one topic-shift clear case."
  );
  lines.push(
    "- Planner turns: sample one accept, one downgrade, and one reject case from `runtime_memory_candidates.summary`."
  );
  lines.push(
    "- Role-presence turns: manually inspect whether replies only preserve tone, or also preserve persona/background texture."
  );
  lines.push("");

  return lines.join("\n");
}

async function main() {
  loadLocalEnv(process.cwd());
  const cwd = path.resolve(process.cwd());
  const results: ValidationStepResult[] = [];

  for (const [index, step] of VALIDATION_STEPS.entries()) {
    console.log(`\n[memory-sampling-validation] (${index + 1}/${VALIDATION_STEPS.length}) ${step.label}`);
    results.push(await runStep(step, cwd));
  }

  console.log(`\n${renderMarkdown(results)}`);
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown memory sampling validation failure."
  );
  process.exitCode = 1;
});
