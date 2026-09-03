import assert from "node:assert/strict";
import test from "node:test";
import { CommerceError } from "../src/domain/errors.js";
import { initialProducts } from "../src/domain/catalog.js";
import { CommerceService, HORIZON_TENANT_ID } from "../src/services/commerce-service.js";

const heresyId = "prd_horizon_heresy_journal";
const edcId = "prd_horizon_everyday_carry_pouch";
const banzaiId = "prd_horizon_banzai_journal";

test("Horizon seed preserves finished stock, made-to-order, and sold truth", async () => {
  const service = new CommerceService();
  const [heresy, edc] = await service.listProducts();
  assert.equal(heresy.title, "Heresy Journal");
  assert.equal(heresy.quantity, 1);
  assert.equal(heresy.publicCheckout, false);
  assert.equal(edc.title, "Everyday Carry Pouch");
  assert.equal(edc.fulfillmentModel, "made_to_order");
  assert.equal(edc.quantity, null);

  for (const product of initialProducts.filter((entry) => entry.tenantId === HORIZON_TENANT_ID && entry.state === "sold")) {
    assert.equal(product.fulfillmentModel, "gallery_only");
    assert.equal(product.quantity, 0);
    assert.equal(product.publicCheckout, false);
  }
});

test("mock cart permits a deterministic preview but rejects sold work", async () => {
  const service = new CommerceService();
  const cart = await service.createMockCart(edcId, 1);
  assert.equal(cart.provider, "mock");
  assert.match(cart.checkoutUrl, /^https:\/\/checkout\.mock\.horizon\.invalid\//);
  await assert.rejects(() => service.createMockCart(banzaiId, 1), (error: unknown) => error instanceof CommerceError && error.code === "PRODUCT_NOT_PURCHASABLE");
});

test("inventory execution is exact-bound, approved, idempotent, and receipted", () => {
  const service = new CommerceService();
  const prepared = service.prepareInventoryAdjustment({ productId: heresyId, delta: -1, expectedVersion: 1, actor: "curtis-owner-test" });
  const approved = service.approveMutation(prepared.id, "curtis-owner-test");
  assert.equal(approved.status, "approved");
  const first = service.executeInventoryAdjustment({ productId: heresyId, delta: -1, expectedVersion: 1, approvalId: approved.id, idempotencyKey: "test-heresy-quantity-one", actor: "curtis-owner-test" });
  assert.equal(first.product.quantity, 0);
  assert.equal(first.replayed, false);
  assert.equal(first.receipt.outcome, "success");
  assert.equal(first.receipt.beforeStateHash.length, 64);
  assert.equal(first.receipt.afterStateHash.length, 64);

  const replay = service.executeInventoryAdjustment({ productId: heresyId, delta: -1, expectedVersion: 1, approvalId: approved.id, idempotencyKey: "test-heresy-quantity-one", actor: "curtis-owner-test" });
  assert.equal(replay.replayed, true);
  assert.equal(replay.product.quantity, 0);
  assert.equal(replay.receipt.outcome, "replayed");
});

test("tenant scope rejects an identifier belonging to another tenant", () => {
  const service = new CommerceService();
  assert.throws(
    () => service.controlPlane.getProduct(HORIZON_TENANT_ID, "prd_copper_finch_print"),
    (error: unknown) => error instanceof CommerceError && error.code === "PRODUCT_NOT_FOUND",
  );
});
