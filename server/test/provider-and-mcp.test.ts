import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { CommerceError } from "../src/domain/errors.js";
import { commerceToolCatalog } from "../src/mcp/tool-catalog.js";
import { ShopifyProvider } from "../src/providers/commerce/shopify/provider.js";
import { verifyShopifyWebhook, WebhookReplayLedger } from "../src/providers/commerce/shopify/webhook.js";

test("Shopify adapter has no pre-gate operation path", async () => {
  const provider = new ShopifyProvider();
  const state = await provider.getConnectionStatus();
  assert.deepEqual(state, { provider: "shopify", connectionState: "disconnected", gate: "closed" });
  await assert.rejects(() => provider.listProducts("tenant_horizon_creations"), (error: unknown) => error instanceof CommerceError && error.code === "SHOPIFY_CONNECTION_REQUIRED");
});

test("MCP tool catalog contains required read and controlled mutation boundaries", () => {
  assert.equal(commerceToolCatalog.length, 12);
  assert.equal(commerceToolCatalog.find((tool) => tool.name === "get_horizon_inventory")?.readOnly, true);
  assert.equal(commerceToolCatalog.find((tool) => tool.name === "execute_horizon_inventory_adjustment")?.mutation, true);
  assert.equal(commerceToolCatalog.some((tool) => tool.name.includes("payment") || tool.name.includes("checkout")), false);
});

test("webhook verifier requires raw-body HMAC and rejects replay", () => {
  const body = Buffer.from('{"topic":"orders/create"}');
  const secret = "local-webhook-test-secret";
  const signature = createHmac("sha256", secret).update(body).digest("base64");
  assert.doesNotThrow(() => verifyShopifyWebhook(body, signature, secret));
  assert.throws(() => verifyShopifyWebhook(body, "not-the-right-signature", secret), (error: unknown) => error instanceof CommerceError && error.code === "SHOPIFY_WEBHOOK_UNVERIFIED");
  const ledger = new WebhookReplayLedger();
  ledger.accept("tenant_horizon_creations", "event-1");
  assert.throws(() => ledger.accept("tenant_horizon_creations", "event-1"), (error: unknown) => error instanceof CommerceError && error.code === "WEBHOOK_REPLAY");
});
