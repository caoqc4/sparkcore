import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv } from "./load-local-env";

type RegressionSuite = "core" | "full";

type RegressionStep = {
  id: string;
  label: string;
  command: string;
  args: string[];
};

type RegressionStepResult = {
  id: string;
  label: string;
  command: string;
  exitCode: number;
  durationMs: number;
};

function resolveSuite(argv: string[]): RegressionSuite {
  const suiteArg = argv.find((item) => item.startsWith("--suite="));
  const suite = suiteArg?.slice("--suite=".length);

  if (suite === "full") {
    return "full";
  }

  return "core";
}

function getRegressionSteps(suite: RegressionSuite): RegressionStep[] {
  const coreSteps: RegressionStep[] = [
    {
      id: "typecheck",
      label: "Typecheck",
      command: "pnpm",
      args: ["run", "typecheck"]
    },
    {
      id: "upgrade",
      label: "Memory upgrade harness",
      command: "pnpm",
      args: ["run", "memory:upgrade:harness"]
    },
    {
      id: "mood_gate",
      label: "Mood gate harness",
      command: "pnpm",
      args: ["run", "memory:mood-gate:harness"]
    },
    {
      id: "relationship_adoption_metadata",
      label: "Relationship adoption metadata harness",
      command: "pnpm",
      args: ["run", "memory:relationship-adoption-metadata:harness"]
    },
    {
      id: "relationship_adoption_preview",
      label: "Relationship adoption preview harness",
      command: "pnpm",
      args: ["run", "memory:relationship-adoption-preview:harness"]
    },
    {
      id: "recall_routing",
      label: "Recall routing harness",
      command: "pnpm",
      args: ["run", "memory:recall-routing:harness"]
    },
    {
      id: "recall_policy_metadata",
      label: "Recall policy metadata harness",
      command: "pnpm",
      args: ["run", "memory:recall-policy-metadata:harness"]
    },
    {
      id: "recall_event",
      label: "Recall event harness",
      command: "pnpm",
      args: ["run", "memory:recall-event:harness"]
    },
    {
      id: "knowledge_gating_observability",
      label: "Knowledge gating observability harness",
      command: "pnpm",
      args: ["run", "memory:knowledge-gating-observability:harness"]
    },
    {
      id: "planner_observability",
      label: "Planner runtime observability harness",
      command: "pnpm",
      args: ["run", "memory:planner-runtime-observability:harness"]
    },
    {
      id: "planner_runtime_smoke",
      label: "Planner runtime smoke harness",
      command: "pnpm",
      args: ["run", "memory:planner-runtime-smoke:harness"]
    },
    {
      id: "thread_state_writeback",
      label: "Thread-state writeback harness",
      command: "pnpm",
      args: ["run", "thread-state:writeback:harness"]
    },
    {
      id: "thread_state_writeback_event",
      label: "Thread-state writeback event harness",
      command: "pnpm",
      args: ["run", "thread-state:writeback-event:harness"]
    },
    {
      id: "product_feedback_incident_metadata",
      label: "Product feedback incident metadata harness",
      command: "pnpm",
      args: ["run", "product-feedback:incident-metadata:harness"]
    }
  ];

  if (suite === "core") {
    return coreSteps;
  }

  return coreSteps.concat([
    {
      id: "smoke_baseline_confirmation",
      label: "Baseline smoke confirmation",
      command: "pnpm",
      args: ["run", "smoke:baseline-confirmation"]
    },
    {
      id: "smoke_planner_regression",
      label: "Planner smoke regression",
      command: "pnpm",
      args: ["run", "smoke:planner-regression"]
    }
  ]);
}

async function runStep(
  step: RegressionStep,
  cwd: string
): Promise<RegressionStepResult> {
  const startedAt = Date.now();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${step.id} failed with exit code ${code ?? 1}`));
    });
  });

  return {
    id: step.id,
    label: step.label,
    command: `${step.command} ${step.args.join(" ")}`,
    exitCode: 0,
    durationMs: Date.now() - startedAt
  };
}

async function main() {
  loadLocalEnv(process.cwd());

  const suite = resolveSuite(process.argv.slice(2));
  const cwd = path.resolve(process.cwd());
  const steps = getRegressionSteps(suite);
  const results: RegressionStepResult[] = [];

  for (const [index, step] of steps.entries()) {
    console.log(
      `\n[stage-regression] (${index + 1}/${steps.length}) ${step.label}`
    );
    const result = await runStep(step, cwd);
    results.push(result);
  }

  const totalDurationMs = results.reduce(
    (sum, result) => sum + result.durationMs,
    0
  );

  console.log(
    `\n${JSON.stringify(
      {
        status: "ok",
        suite,
        total: results.length,
        total_duration_ms: totalDurationMs,
        steps: results.map((result) => ({
          id: result.id,
          label: result.label,
          duration_ms: result.durationMs
        }))
      },
      null,
      2
    )}`
  );
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown memory stage regression failure."
  );
  process.exitCode = 1;
});
