import { spawn, type ChildProcess } from "node:child_process";

type WorkerSpec = {
  label: string;
  script: string;
};

const workers: WorkerSpec[] = [
  {
    label: "discord",
    script: "scripts/discord-gateway-dev.ts"
  },
  {
    label: "feishu",
    script: "scripts/feishu-ws-dev.ts"
  },
  {
    label: "wechat",
    script: "scripts/wechat-openilink-session-manager.ts"
  }
];

const children: ChildProcess[] = [];
let shuttingDown = false;
const workerLabels = new Map<number, string>();

function prefixLines(label: string, chunk: Buffer | string) {
  const text = String(chunk);
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    console.log(`[${label}] ${line}`);
  }
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(code);
  }, 1000).unref();
}

for (const worker of workers) {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", worker.script],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"]
    }
  );

  children.push(child);

  child.stdout?.on("data", (chunk) => {
    prefixLines(worker.label, chunk);
  });

  child.stderr?.on("data", (chunk) => {
    prefixLines(`${worker.label}:error`, chunk);
  });

  child.on("exit", (code, signal) => {
    console.log(
      `[${worker.label}] exited` +
        (signal ? ` via ${signal}` : ` with code ${code ?? 0}`)
    );

    const expectedShutdown = shuttingDown || signal === "SIGTERM" || signal === "SIGINT";

    if (!expectedShutdown && (code ?? 0) !== 0) {
      console.log(
        `[im-workers] ${worker.label} stopped, but other workers will keep running.`
      );
      return;
    }

    if (!expectedShutdown) {
      shutdown(code ?? 1);
    }
  });

  if (child.pid) {
    workerLabels.set(child.pid, worker.label);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
