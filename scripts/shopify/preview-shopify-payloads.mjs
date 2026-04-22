import { loadStagedProducts, validateStagedProduct, getExportDecision } from "./lib/staged-products.mjs";
import { buildProductPayload, buildFutureSyncPlan } from "./lib/payloads.mjs";
import { logger } from "./lib/logger.mjs";

logger.step("Previewing staged Shopify payloads locally.");

const stagedProducts = await loadStagedProducts();

for (const product of stagedProducts) {
  const validation = validateStagedProduct(product);

  if (!validation.valid) {
    logger.warn(`${product.slug}: skipped preview because validation failed.`);
    continue;
  }

  const decision = getExportDecision(product);

  logger.info(`${product.slug}: ${decision.reason}`);
  console.log(
    JSON.stringify(
      {
        slug: product.slug,
        kind: product.data.kind,
        exportDecision: decision,
        payload: buildProductPayload(product),
        futureSync: buildFutureSyncPlan(product),
      },
      null,
      2,
    ),
  );
}
