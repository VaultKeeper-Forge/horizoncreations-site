import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", "dist", "artifacts", "coverage"]);
const inspectable = new Set([".ts", ".mts", ".mjs", ".js", ".json", ".yaml", ".yml", ".sql", ".md", ".env", ".example"]);
const secretPatterns = [
  { name: "shopify_admin_token", pattern: new RegExp(`\\b${"sh" + "pat_"}[A-Za-z0-9_-]{12,}\\b`) },
  { name: "shopify_secret", pattern: new RegExp(`\\b${"sh" + "pss_"}[A-Za-z0-9_-]{12,}\\b`) },
  { name: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: "stripe_live_key", pattern: /\bsk_live_[A-Za-z0-9]{16,}\b/ },
  { name: "aws_access_key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (inspectable.has(extname(entry.name)) || entry.name.startsWith(".env")) files.push(fullPath);
  }
  return files;
}

const findings = [];
for (const file of await walk(root)) {
  const content = await readFile(file, "utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) findings.push({ file: relative(root, file), name });
  }
}

if (findings.length) {
  console.error(JSON.stringify({ result: "FAIL", findings }));
  process.exit(1);
}
console.log(JSON.stringify({ result: "PASS", filesScanned: (await walk(root)).length, findings: [] }));
