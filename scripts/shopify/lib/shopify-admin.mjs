import { getAdminGraphqlEndpoint, shopifyConfig, assertAdminCredentials } from "./shopify-config.mjs";

export async function adminGraphqlRequest({ query, variables }) {
  assertAdminCredentials();

  const response = await fetch(getAdminGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyConfig.adminAccessToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const detail = JSON.stringify(payload);
    throw new Error(`Shopify Admin API request failed with ${response.status}: ${detail}`);
  }

  if (payload.errors?.length) {
    throw new Error(`Shopify Admin API returned GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }

  return payload;
}
