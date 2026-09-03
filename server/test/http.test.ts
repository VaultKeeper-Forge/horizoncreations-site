import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/http/app.js";
import { readConfig } from "../src/config/config.js";

test("HTTP surface is mock-only, owner-protected, and keeps checkout disabled", async () => {
  const app = await buildApp({ config: readConfig({ NODE_ENV: "test" }) });
  try {
    const health = await app.inject({ method: "GET", url: "/health" });
    assert.equal(health.statusCode, 200);
    assert.equal(health.json().gate, "closed");

    const catalog = await app.inject({ method: "GET", url: "/api/v1/storefront/catalog" });
    assert.equal(catalog.statusCode, 200);
    assert.equal(catalog.json().publicCheckout, false);
    assert.equal(catalog.json().products.find((product: { title: string }) => product.title === "Everyday Carry Pouch").quantity, null);

    const cart = await app.inject({ method: "POST", url: "/api/v1/storefront/cart", payload: { productId: "prd_horizon_heresy_journal", quantity: 1 } });
    assert.equal(cart.statusCode, 201);
    assert.equal(cart.json().checkout.mode, "mock");
    assert.equal(cart.json().checkout.publicCheckout, false);

    const soldCart = await app.inject({ method: "POST", url: "/api/v1/storefront/cart", payload: { productId: "prd_horizon_banzai_journal", quantity: 1 } });
    assert.equal(soldCart.statusCode, 403);
    assert.equal(soldCart.json().error.code, "PRODUCT_NOT_PURCHASABLE");

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/owner/commerce-status" });
    assert.equal(unauthenticated.statusCode, 403);
    assert.equal(unauthenticated.json().error.code, "OWNER_AUTH_REQUIRED");

    const owner = await app.inject({ method: "GET", url: "/api/v1/owner/commerce-status", headers: { "x-malone-owner": "curtis-owner-test" } });
    assert.equal(owner.statusCode, 200);
    assert.equal(owner.json().publicCheckout, false);

    const webhook = await app.inject({ method: "POST", url: "/webhooks/shopify", payload: {} });
    assert.equal(webhook.statusCode, 503);
    assert.equal(webhook.json().error.code, "SHOPIFY_CONNECTION_REQUIRED");
  } finally {
    await app.close();
  }
});

test("OAuth discovery is explicit and production refuses local test auth", () => {
  const testConfig = readConfig({ NODE_ENV: "test" });
  assert.equal(testConfig.OWNER_AUTH_MODE, "local-test");
  assert.throws(() => readConfig({ NODE_ENV: "production" }), /OWNER_AUTH_MODE=local-test/);
});
