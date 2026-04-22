import { loadStagedProducts, validateStagedProduct, getExportDecision, writeUpdatedStagedProduct } from "./lib/staged-products.mjs";
import { buildProductCreateOperation, buildFutureSyncPlan } from "./lib/payloads.mjs";
import { adminGraphqlRequest } from "./lib/shopify-admin.mjs";
import { assertAdminCredentials } from "./lib/shopify-config.mjs";
import { logger } from "./lib/logger.mjs";

const dryRun = process.argv.includes("--dry-run");

logger.step(dryRun ? "Running Shopify export dry-run." : "Running Shopify export.");

if (!dryRun) {
  assertAdminCredentials();
}

const stagedProducts = await loadStagedProducts();
const exportableProducts = [];
let invalidCount = 0;

for (const product of stagedProducts) {
  const validation = validateStagedProduct(product);

  if (!validation.valid) {
    invalidCount += 1;
    logger.error(`${product.slug}: invalid staged product.`);
    for (const error of validation.errors) {
      logger.error(`  - ${error}`);
    }
    continue;
  }

  const decision = getExportDecision(product);

  if (!decision.exportable) {
    logger.info(`${product.slug}: skipped (${decision.reason})`);
    continue;
  }

  exportableProducts.push(product);
}

if (invalidCount > 0) {
  logger.error("Fix validation errors before exporting staged products.");
  process.exitCode = 1;
  process.exit();
}

if (!exportableProducts.length) {
  logger.warn("No approved sellable products are ready for export.");
  process.exit();
}

if (dryRun) {
  for (const product of exportableProducts) {
    const operation = buildProductCreateOperation(product);
    logger.info(`${product.slug}: dry-run export preview`);
    console.log(JSON.stringify(operation, null, 2));
  }

  logger.info(`Dry-run completed for ${exportableProducts.length} product${exportableProducts.length === 1 ? "" : "s"}.`);
  process.exit();
}

for (const product of exportableProducts) {
  if (product.data.shopify?.productId) {
    logger.warn(
      `${product.slug}: already has Shopify product id ${product.data.shopify.productId}. ` +
        "Future update/sync architecture is scaffolded, but automatic update export is not turned on yet.",
    );
    logger.info(JSON.stringify(buildFutureSyncPlan(product), null, 2));
    continue;
  }

  const operation = buildProductCreateOperation(product);
  logger.step(`${product.slug}: creating Shopify draft product.`);

  const response = await adminGraphqlRequest({
    query: operation.mutation,
    variables: operation.variables,
  });

  const payload = response.data?.productCreate;
  const userErrors = payload?.userErrors || [];

  if (userErrors.length) {
    throw new Error(`${product.slug}: Shopify returned userErrors ${JSON.stringify(userErrors)}`);
  }

  const createdProduct = payload?.product;

  if (!createdProduct?.id) {
    throw new Error(`${product.slug}: Shopify did not return a product id.`);
  }

  const nextData = {
    ...product.data,
    shopify: {
      ...product.data.shopify,
      syncState: "draft-created",
      productId: createdProduct.id,
      lastSyncedAt: new Date().toISOString(),
      lastError: "",
    },
  };

  await writeUpdatedStagedProduct(product, nextData);
  logger.info(`${product.slug}: created Shopify draft product ${createdProduct.id}`);
}

logger.info("Shopify export finished.");
