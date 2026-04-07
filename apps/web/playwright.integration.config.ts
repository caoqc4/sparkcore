import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

function resolveChromeExecutable() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    path.join(
      process.env.HOME ?? "",
      "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    )
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

loadLocalEnv();

const chromeExecutablePath = resolveChromeExecutable();
const smokeSecret =
  process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const smokeEmail =
  process.env.PLAYWRIGHT_SMOKE_EMAIL ?? "smoke@example.com";
const smokePassword =
  process.env.PLAYWRIGHT_SMOKE_PASSWORD ?? "SparkcoreSmoke123!";

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  timeout: 240_000,
  expect: {
    timeout: 30_000
  },
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "retain-on-failure"
  },
  webServer: {
    command:
      `npm run build && PLAYWRIGHT_SMOKE_SECRET=${shellQuote(smokeSecret)} PLAYWRIGHT_SMOKE_EMAIL=${shellQuote(smokeEmail)} PLAYWRIGHT_SMOKE_PASSWORD=${shellQuote(smokePassword)} npm run start -- --hostname 127.0.0.1 --port 3002`,
    cwd: __dirname,
    url: "http://127.0.0.1:3002/login",
    reuseExistingServer: false,
    timeout: 180_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        launchOptions: chromeExecutablePath
          ? {
              executablePath: chromeExecutablePath
            }
          : undefined
      }
    }
  ]
});
