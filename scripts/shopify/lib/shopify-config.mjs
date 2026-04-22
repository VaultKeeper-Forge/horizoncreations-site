import { loadLocalEnv } from "./env.mjs";

loadLocalEnv();

export const shopifyConfig = {
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN?.trim() || "",
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || "",
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() || "",
  apiVersion: process.env.SHOPIFY_API_VERSION?.trim() || "2026-04",
};

export function getMissingAdminCredentials() {
  return [
    ["SHOPIFY_STORE_DOMAIN", shopifyConfig.storeDomain],
    ["SHOPIFY_ADMIN_ACCESS_TOKEN", shopifyConfig.adminAccessToken],
    ["SHOPIFY_API_VERSION", shopifyConfig.apiVersion],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export function assertAdminCredentials() {
  const missing = getMissingAdminCredentials();

  if (!missing.length) {
    return;
  }

  throw new Error(
    [
      "Shopify export cannot run because required credentials are missing.",
      `Missing: ${missing.join(", ")}`,
      "Add the values as environment variables or put them in a local ignored `.env.local` file.",
      "Use `.env.example` as the placeholder template.",
    ].join(" "),
  );
}

export function getAdminGraphqlEndpoint() {
  if (!shopifyConfig.storeDomain || !shopifyConfig.apiVersion) {
    return "";
  }

  return `https://${shopifyConfig.storeDomain}/admin/api/${shopifyConfig.apiVersion}/graphql.json`;
}
