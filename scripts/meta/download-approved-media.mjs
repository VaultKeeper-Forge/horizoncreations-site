import path from "node:path";
import { logger } from "../shopify/lib/logger.mjs";
import { buildApprovedDownloadPlan, downloadApprovedItem } from "./lib/download-plan.mjs";
import { loadAllCandidateManifests } from "./lib/source-manifests.mjs";

const dryRun = process.argv.includes("--dry-run");

logger.step(`Building Meta download plan${dryRun ? " (dry run)" : ""}.`);

const manifests = await loadAllCandidateManifests();
const plan = buildApprovedDownloadPlan(manifests);

if (!plan.length) {
  logger.warn("No approved social media items are marked for download yet.");
  process.exit(0);
}

for (const item of plan) {
  logger.info(
    `${item.platform} ${item.sourceId} -> ${item.mediaFiles.length} file(s) into ${path.relative(process.cwd(), item.itemDir)}`,
  );
}

if (dryRun) {
  process.exit(0);
}

for (const item of plan) {
  await downloadApprovedItem(item);
  logger.info(`Downloaded ${item.sourceId} into ${path.relative(process.cwd(), item.itemDir)}`);
}
