import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const candidateEnvFiles = [".env.local"];

function normalizeValue(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function loadLocalEnv(rootDir = process.cwd()) {
  for (const fileName of candidateEnvFiles) {
    const filePath = path.join(rootDir, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const source = readFileSync(filePath, "utf8");

    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = normalizeValue(trimmed.slice(separatorIndex + 1));

      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
