import { execFileSync } from "node:child_process";

type FlyMachineEvent = {
  type?: string;
  status?: string;
  source?: string;
  timestamp?: number;
};

type FlyMachineStatus = {
  id: string;
  name?: string;
  state?: string;
  config?: {
    standbys?: string[];
  };
  events?: FlyMachineEvent[];
};

type FlyStatusResponse = {
  Name?: string;
  Status?: string;
  Machines?: FlyMachineStatus[];
};

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function runFly(args: string[]) {
  return execFileSync("fly", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatus(app: string) {
  const output = runFly(["status", "--app", app, "--json"]);
  return JSON.parse(output) as FlyStatusResponse;
}

function inferPrimaryMachineId(machines: FlyMachineStatus[]) {
  const standbyTargets = new Set(
    machines.flatMap((machine) => machine.config?.standbys ?? [])
  );

  const referencedPrimary = machines.find((machine) => standbyTargets.has(machine.id));
  if (referencedPrimary) {
    return referencedPrimary.id;
  }

  const nonStandbyMachine = machines.find(
    (machine) => (machine.config?.standbys?.length ?? 0) === 0
  );
  if (nonStandbyMachine) {
    return nonStandbyMachine.id;
  }

  return machines[0]?.id ?? null;
}

async function waitForPrimaryStarted(args: {
  app: string;
  primaryMachineId: string;
  timeoutMs: number;
}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < args.timeoutMs) {
    const status = getStatus(args.app);
    const primary = status.Machines?.find(
      (machine) => machine.id === args.primaryMachineId
    );

    if (primary?.state === "started") {
      return primary;
    }

    await sleep(2_000);
  }

  throw new Error(
    `Primary machine ${args.primaryMachineId} did not reach started state within ${Math.round(
      args.timeoutMs / 1000
    )} seconds.`
  );
}

function readRecentLogs(app: string) {
  return runFly(["logs", "--app", app, "--no-tail"]);
}

async function main() {
  const app = getArgValue("--app") ?? "sparkcore-telegram";
  const timeoutMs = 45_000;
  const status = getStatus(app);
  const machines = status.Machines ?? [];

  if (machines.length === 0) {
    throw new Error(`No machines found for Fly app ${app}.`);
  }

  const primaryMachineId = inferPrimaryMachineId(machines);
  if (!primaryMachineId) {
    throw new Error(`Unable to infer primary machine for Fly app ${app}.`);
  }

  const primary = machines.find((machine) => machine.id === primaryMachineId) ?? null;
  const primaryState = primary?.state ?? "unknown";
  const primaryUpdatedAt =
    primary?.events?.find((event) => event.type === "start" || event.type === "update")
      ?.timestamp ?? null;

  console.log("[telegram-worker:post-deploy-check]", {
    app,
    fly_status: status.Status ?? "unknown",
    primary_machine_id: primaryMachineId,
    primary_machine_state: primaryState,
    primary_machine_name: primary?.name ?? null,
    primary_last_event_timestamp: primaryUpdatedAt
  });

  if (primaryState !== "started") {
    console.log("[telegram-worker:post-deploy-check] starting primary machine", {
      app,
      primary_machine_id: primaryMachineId,
      previous_state: primaryState
    });
    runFly(["machine", "start", primaryMachineId, "--app", app]);
    await waitForPrimaryStarted({
      app,
      primaryMachineId,
      timeoutMs
    });
  }

  const logs = readRecentLogs(app);
  const hasWorkerLoop = logs.includes("[telegram-inbound-worker]");

  if (!hasWorkerLoop) {
    throw new Error(
      `Worker log marker not found for ${app}. Expected recent logs to contain [telegram-inbound-worker].`
    );
  }

  const statusAfter = getStatus(app);
  const primaryAfter =
    statusAfter.Machines?.find((machine) => machine.id === primaryMachineId) ?? null;

  console.log("[telegram-worker:post-deploy-check:ok]", {
    app,
    primary_machine_id: primaryMachineId,
    primary_machine_state: primaryAfter?.state ?? "unknown",
    worker_log_marker_found: true
  });
}

main().catch((error) => {
  console.error("[telegram-worker:post-deploy-check:failed]", {
    error_name: error instanceof Error ? error.name : null,
    error_message: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
