import { forbidden } from "../../../domain/errors.js";
import type { CommerceCart, CommerceOrder, CommerceProduct } from "../../../domain/types.js";
import type { CommerceProvider, InventoryAdjustment } from "../contract.js";

/**
 * The real adapter intentionally has no network path before the owner opens the exact gate.
 * It exists so all callers share the provider contract, while every operation fails closed.
 */
export class ShopifyProvider implements CommerceProvider {
  readonly kind = "shopify" as const;

  private unavailable(): never {
    throw forbidden("SHOPIFY_CONNECTION_REQUIRED", "Shopify is intentionally disconnected. Open the exact owner connection gate before any provider operation.");
  }

  async listProducts(_tenantId: string): Promise<CommerceProduct[]> { return this.unavailable(); }
  async createCart(_tenantId: string, _productId: string, _quantity: number): Promise<CommerceCart> { return this.unavailable(); }
  async adjustInventory(_input: InventoryAdjustment): Promise<CommerceProduct> { return this.unavailable(); }
  async listOrders(_tenantId: string): Promise<CommerceOrder[]> { return this.unavailable(); }
  async getConnectionStatus() { return { provider: this.kind, connectionState: "disconnected" as const, gate: "closed" as const }; }
}
