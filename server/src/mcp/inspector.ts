import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { commerceToolCatalog } from "./tool-catalog.js";

const artifactsDir = resolve(process.cwd(), "artifacts");
await mkdir(artifactsDir, { recursive: true });
const target = resolve(artifactsDir, "mcp-descriptor.json");
await writeFile(target, `${JSON.stringify({ name: "malone-commerce-control", transport: "streamable-http", tools: commerceToolCatalog }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ descriptor: target, toolCount: commerceToolCatalog.length, result: "PASS" }));
