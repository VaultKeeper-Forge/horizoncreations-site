import { logger } from "../shopify/lib/logger.mjs";
import { getMissingMetaCredentials, metaConfig } from "./lib/meta-config.mjs";

const platforms = ["facebook-page", "instagram-business"];
let hasMissing = false;

logger.step("Checking Meta import configuration.");

for (const platform of platforms) {
  const missing = getMissingMetaCredentials(platform);

  if (missing.length) {
    hasMissing = true;
    logger.warn(`${platform} is not ready. Missing: ${missing.join(", ")}`);
  } else {
    logger.info(`${platform} is configured.`);
  }
}

logger.info(`Graph API version: ${metaConfig.graphApiVersion}`);
logger.info(`Import limit: ${metaConfig.importLimit}`);

if (hasMissing) {
  logger.error("Meta import config is incomplete.");
  process.exitCode = 1;
} else {
  logger.info("Meta import config looks ready.");
}
