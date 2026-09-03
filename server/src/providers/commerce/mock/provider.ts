import { randomUUID } from "node:crypto";
import { forbidden } from "../../../domain/errors.js";
import type { CommerceCart, CommerceOrder, CommerceProduct } from "../../../domain/types.js";
import type { InMemoryControlPlane } from "../../../audit/control-plane.js";
import type { CommerceProvider, InventoryAdjustment } from "../contract.js";

export class MockCommerceProvider implements CommerceProvider {
  readonly kind = "mock" as const;

  constructor(private readonly controlPlane: InMemoryControlPlane) {}

  async listProducts(tenantId: string): Promise<CommerceProduct[]> {
    return this.controlPlane.listProducts(tenantId);
  }

  async createCart(tenantId: string, productId: string, quantity: number): Promise<CommerceCart> {
    const product = this.controlPlane.getProduct(tenantId, productId);
    if (quantity < 1) throw forbidden("INVALID_CART_QUANTITY", "Cart quantity must be at least one.");
    if (product.state === "sold" || product.fulfillmentModel === "gallery_only") throw forbidden("PRODUCT_NOT_PURCHASABLE", "Sold and gallery-only work cannot be added to a cart.", { productId });
    if (product.fulfillmentModel === "finished_stock" && (product.quantity ?? 0) < quantity) throw forbidden("INSUFFICIENT_INVENTORY", "The requested quantity is not available.", { productId, quantity, available: product.quantity });
    const cartId = `mock_cart_${randomUUID()}`;
    return {
      id: cartId,
      tenantId,
      provider: this.kind,
      lines: [{ productId: product.id, sku: product.sku, quantity, unitPriceCents: product.priceCents }],
      checkoutUrl: `https://checkout.mock.horizon.invalid/cart/${cartId}`,
    };
  }

  async adjustInventory(_input: InventoryAdjustment): Promise<CommerceProduct> {
    throw new Error("Inventory execution is owned by the control plane so approvals and receipts cannot be bypassed.");
  }

  async listOrders(tenantId: string): Promise<CommerceOrder[]> {
    return this.controlPlane.listOrders(tenantId);
  }

  async getConnectionStatus() {
    return { provider: this.kind, connectionState: "disconnected" as const, gate: "closed" as const };
  }
}
