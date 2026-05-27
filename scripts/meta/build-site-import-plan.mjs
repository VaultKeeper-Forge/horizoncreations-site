import { logger } from "../shopify/lib/logger.mjs";
import { loadAllCandidateManifests } from "./lib/source-manifests.mjs";

function buildSitePlan(manifests) {
  const plan = [];

  for (const manifest of manifests) {
    for (const item of manifest.data.items || []) {
      if (!item.workflow?.approvedForSiteUse) {
        continue;
      }

      plan.push({
        platform: manifest.data.platform,
        sourceId: item.sourceId,
        permalink: item.permalink || "",
        caption: item.caption || "",
        targetSection: item.workflow.targetSection || "",
        targetSlugHint: item.workflow.targetSlugHint || "",
        notes: item.workflow.notes || "",
      });
    }
  }

  return plan;
}

logger.step("Building Meta site-import plan.");

const manifests = await loadAllCandidateManifests();
const plan = buildSitePlan(manifests);

if (!plan.length) {
  logger.warn("No social media items are marked approved for site use yet.");
  process.exit(0);
}

logger.info(`Found ${plan.length} approved site-import candidate(s).`);
console.log(JSON.stringify(plan, null, 2));
