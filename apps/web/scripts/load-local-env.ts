import fs from "node:fs";
import path from "node:path";

function parseEnvFile(contents: string) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const normalized =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;

    process.env[key] = normalized;
  }
}

export function loadLocalEnv(cwd = process.cwd()) {
  const candidates = [".env.local", ".env.production.local", ".env"];

  for (const filename of candidates) {
    const fullPath = path.join(cwd, filename);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    parseEnvFile(fs.readFileSync(fullPath, "utf8"));
  }
}
