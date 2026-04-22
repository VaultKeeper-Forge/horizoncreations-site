import { loadStagedProducts, validateStagedProduct, getExportDecision } from "./lib/staged-products.mjs";
import { logger } from "./lib/logger.mjs";

logger.step("Validating staged product entries.");

const stagedProducts = await loadStagedProducts();
let invalidCount = 0;

for (const product of stagedProducts) {
  const validation = validateStagedProduct(product);
  const decision = getExportDecision(product);

  if (!validation.valid) {
    invalidCount += 1;
    logger.error(`${product.slug}: invalid`);
    for (const error of validation.errors) {
      logger.error(`  - ${error}`);
    }
    continue;
  }

  logger.info(`${product.slug}: valid (${decision.reason})`);
}

if (invalidCount > 0) {
  logger.error(`Validation finished with ${invalidCount} invalid staged product entr${invalidCount === 1 ? "y" : "ies"}.`);
  process.exitCode = 1;
} else {
  logger.info(`Validation passed for ${stagedProducts.length} staged product entr${stagedProducts.length === 1 ? "y" : "ies"}.`);
}
