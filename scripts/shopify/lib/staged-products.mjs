import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, "content", "product-staging");

const allowedKinds = new Set(["gallery-only", "custom-not-for-sale", "sellable-product"]);
const allowedStatuses = new Set(["draft", "ready-for-review", "approved", "hold"]);
const allowedSyncStates = new Set([
  "not-applicable",
  "not-ready",
  "ready",
  "draft-created",
  "synced",
  "error",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidMoney(value) {
  return isNonEmptyString(value) && /^(0|[1-9]\d*)(\.\d{2})$/.test(value.trim());
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getProductStagingDirectory() {
  return stagingDir;
}

export async function loadStagedProducts() {
  const dirEntries = await readdir(stagingDir, { withFileTypes: true });
  const folders = dirEntries.filter((entry) => entry.isDirectory());
  const products = [];

  for (const folder of folders) {
    const filePath = path.join(stagingDir, folder.name, "product.json");
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);

    products.push({
      slug: folder.name,
      filePath,
      dirPath: path.dirname(filePath),
      data,
    });
  }

  return products.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function validateStagedProduct(product) {
  const errors = [];
  const { data, slug } = product;

  if (!allowedKinds.has(data.kind)) {
    errors.push(`"${slug}" has invalid kind "${data.kind}".`);
  }

  if (!isNonEmptyString(data.title)) {
    errors.push(`"${slug}" is missing a title.`);
  }

  if (!isNonEmptyString(data.description)) {
    errors.push(`"${slug}" is missing a description.`);
  }

  if (!allowedStatuses.has(data.status)) {
    errors.push(`"${slug}" has invalid status "${data.status}".`);
  }

  if (!isNonEmptyString(data.category)) {
    errors.push(`"${slug}" is missing a category.`);
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some((tag) => !isNonEmptyString(tag))) {
    errors.push(`"${slug}" must include at least one valid tag.`);
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.push(`"${slug}" must include at least one image reference.`);
  } else {
    for (const [index, image] of data.images.entries()) {
      if (!image || !isNonEmptyString(image.path)) {
        errors.push(`"${slug}" image ${index + 1} is missing a path.`);
      }
    }
  }

  if (!data.source || !isNonEmptyString(data.source.entrySection) || !isNonEmptyString(data.source.entrySlug)) {
    errors.push(`"${slug}" must include source.entrySection and source.entrySlug.`);
  }

  if (!data.workflow || typeof data.workflow !== "object") {
    errors.push(`"${slug}" is missing workflow settings.`);
  } else if (typeof data.workflow.approvedForExport !== "boolean" || typeof data.workflow.readyForReview !== "boolean") {
    errors.push(`"${slug}" workflow flags must be booleans.`);
  }

  if (!data.shopify || typeof data.shopify !== "object") {
    errors.push(`"${slug}" is missing shopify sync metadata.`);
  } else if (!allowedSyncStates.has(data.shopify.syncState)) {
    errors.push(`"${slug}" has invalid shopify.syncState "${data.shopify.syncState}".`);
  }

  if (!Number.isInteger(data.quantity) || data.quantity < 0) {
    errors.push(`"${slug}" quantity must be a non-negative integer.`);
  }

  if (typeof data.publish !== "boolean") {
    errors.push(`"${slug}" publish must be true or false.`);
  }

  if (typeof data.sellable !== "boolean") {
    errors.push(`"${slug}" sellable must be true or false.`);
  }

  if (data.kind === "sellable-product") {
    if (!data.sellable) {
      errors.push(`"${slug}" is marked sellable-product but sellable is false.`);
    }

    if (!isValidMoney(data.price)) {
      errors.push(`"${slug}" needs a valid price in 0.00 format.`);
    }
  } else {
    if (data.sellable) {
      errors.push(`"${slug}" is not a sellable-product but sellable is true.`);
    }

    if (data.workflow?.approvedForExport) {
      errors.push(`"${slug}" is not sellable but workflow.approvedForExport is true.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getExportDecision(product) {
  const { data } = product;

  if (data.kind !== "sellable-product") {
    return {
      exportable: false,
      reason: "Not a sellable product.",
    };
  }

  if (!data.workflow?.readyForReview) {
    return {
      exportable: false,
      reason: "Not marked ready for review.",
    };
  }

  if (!data.workflow?.approvedForExport) {
    return {
      exportable: false,
      reason: "Not approved for export.",
    };
  }

  if (data.status === "hold") {
    return {
      exportable: false,
      reason: "Item is on hold.",
    };
  }

  return {
    exportable: true,
    reason: "Approved sellable product.",
  };
}

export async function writeUpdatedStagedProduct(product, nextData) {
  const updatedJson = `${JSON.stringify(clone(nextData), null, 2)}\n`;
  await writeFile(product.filePath, updatedJson, "utf8");
}
