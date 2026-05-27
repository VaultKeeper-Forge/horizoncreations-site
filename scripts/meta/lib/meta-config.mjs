import { loadLocalEnv } from "../../shopify/lib/env.mjs";

loadLocalEnv();

function normalizeApiVersion(rawValue) {
  const value = rawValue?.trim() || "v24.0";

  return value.startsWith("v") ? value : `v${value}`;
}

function parseLimit(rawValue) {
  const value = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(value) || value <= 0) {
    return 12;
  }

  return Math.min(value, 50);
}

export const metaConfig = {
  accessToken: process.env.META_ACCESS_TOKEN?.trim() || "",
  graphApiVersion: normalizeApiVersion(process.env.META_GRAPH_API_VERSION),
  facebookPageId: process.env.META_FACEBOOK_PAGE_ID?.trim() || "",
  instagramBusinessAccountId: process.env.META_INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() || "",
  importLimit: parseLimit(process.env.META_IMPORT_LIMIT),
};

const sharedRequired = [["META_ACCESS_TOKEN", metaConfig.accessToken], ["META_GRAPH_API_VERSION", metaConfig.graphApiVersion]];

const platformSpecificRequired = {
  "facebook-page": [["META_FACEBOOK_PAGE_ID", metaConfig.facebookPageId]],
  "instagram-business": [["META_INSTAGRAM_BUSINESS_ACCOUNT_ID", metaConfig.instagramBusinessAccountId]],
};

export function getMissingMetaCredentials(platform) {
  const required = [...sharedRequired, ...(platformSpecificRequired[platform] || [])];

  return required.filter(([, value]) => !value).map(([name]) => name);
}

export function assertMetaCredentials(platform) {
  const missing = getMissingMetaCredentials(platform);

  if (!missing.length) {
    return;
  }

  throw new Error(
    [
      `Meta ${platform} import cannot run because required credentials are missing.`,
      `Missing: ${missing.join(", ")}`,
      "Add the values as environment variables or put them in a local ignored `.env.local` file.",
      "Use `.env.example` as the placeholder template.",
    ].join(" "),
  );
}

export function getGraphApiBaseUrl() {
  return `https://graph.facebook.com/${metaConfig.graphApiVersion}`;
}
