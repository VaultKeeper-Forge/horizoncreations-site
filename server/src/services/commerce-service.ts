import { stableHash } from "../audit/hash.js";
import { InMemoryControlPlane } from "../audit/control-plane.js";
import { forbidden } from "../domain/errors.js";
import { horizonTenant } from "../domain/catalog.js";
import type { ApprovalRequest, CommerceCart, CommerceProduct, OperationsSnapshot } from "../domain/types.js";
import { MockCommerceProvider } from "../providers/commerce/mock/provider.js";
import { ShopifyProvider } from "../providers/commerce/shopify/provider.js";
import type { CommerceProvider } from "../providers/commerce/contract.js";

export const HORIZON_TENANT_ID = horizonTenant.id;

export class CommerceService {
  readonly provider: CommerceProvider;

  constructor(readonly controlPlane = new InMemoryControlPlane()) {
    this.provider = new MockCommerceProvider(controlPlane);
  }

  createDisabledShopifyAdapter(): ShopifyProvider {
    return new ShopifyProvider();
  }

  async operationsSnapshot(tenantId = HORIZON_TENANT_ID): Promise<OperationsSnapshot> {
    const tenant = this.controlPlane.getTenant(tenantId);
    const inventory = this.controlPlane.listProducts(tenantId).map(({ id, title, sku, state, quantity, fulfillmentModel }) => ({ id, title, sku, state, quantity, fulfillmentModel }));
    return {
      tenant: { id: tenant.id, name: tenant.name, currency: tenant.currency, connectionState: tenant.connectionState, provider: tenant.provider },
      gate: "closed",
      publicCheckout: false,
      inventory,
      openApprovals: this.controlPlane.countOpenApprovals(tenantId),
      recentReceipts: this.controlPlane.countReceipts(tenantId),
    };
  }

  async listProducts(tenantId = HORIZON_TENANT_ID): Promise<CommerceProduct[]> {
    return this.provider.listProducts(tenantId);
  }

  async getProduct(productId: string, tenantId = HORIZON_TENANT_ID): Promise<CommerceProduct> {
    return this.controlPlane.getProduct(tenantId, productId);
  }

  async getInventory(sku: string, tenantId = HORIZON_TENANT_ID): Promise<Pick<CommerceProduct, "id" | "sku" | "title" | "state" | "quantity" | "fulfillmentModel" | "version">> {
    const product = this.controlPlane.getProductBySku(tenantId, sku);
    return { id: product.id, sku: product.sku, title: product.title, state: product.state, quantity: product.quantity, fulfillmentModel: product.fulfillmentModel, version: product.version };
  }

  async createMockCart(productId: string, quantity: number, tenantId = HORIZON_TENANT_ID): Promise<CommerceCart> {
    const tenant = this.controlPlane.getTenant(tenantId);
    if (tenant.connectionState !== "disconnected" || tenant.provider !== "mock") {
      throw forbidden("MOCK_ONLY", "The pre-connection storefront cart is limited to deterministic mock mode.");
    }
    return this.provider.createCart(tenantId, productId, quantity);
  }

  prepareInventoryAdjustment(input: { productId: string; delta: number; expectedVersion: number; actor: string; tenantId?: string }): ApprovalRequest {
    const tenantId = input.tenantId ?? HORIZON_TENANT_ID;
    const product = this.controlPlane.getProduct(tenantId, input.productId);
    const request = { tenantId, productId: product.id, delta: input.delta, expectedVersion: input.expectedVersion };
    return this.controlPlane.createApproval({
      tenantId,
      action: "inventory.adjust",
      resourceId: product.id,
      requestedBy: input.actor,
      requestHash: stableHash(request),
      beforeStateHash: stableHash(product),
    });
  }

  approveMutation(approvalId: string, ownerSubject: string): ApprovalRequest {
    return this.controlPlane.approve(approvalId, ownerSubject);
  }

  executeInventoryAdjustment(input: { productId: string; delta: number; expectedVersion: number; approvalId: string; idempotencyKey: string; actor: string; tenantId?: string }) {
    const tenantId = input.tenantId ?? HORIZON_TENANT_ID;
    return this.controlPlane.adjustInventory({ ...input, tenantId });
  }

  async listOrders(tenantId = HORIZON_TENANT_ID) {
    return this.provider.listOrders(tenantId);
  }

  fulfillmentReadiness(tenantId = HORIZON_TENANT_ID) {
    const tenant = this.controlPlane.getTenant(tenantId);
    return {
      tenantId,
      connectionState: tenant.connectionState,
      provider: tenant.provider,
      gate: "closed" as const,
      publicCheckout: false,
      result: "SHOPIFY_CONNECTION_REQUIRED",
      requiredAtConnectionGate: ["shipping origin", "package presets", "return policy", "tax onboarding", "payout onboarding", "approved checkout canary"],
    };
  }
}
