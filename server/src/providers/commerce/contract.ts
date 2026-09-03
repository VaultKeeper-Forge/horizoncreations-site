import type { CommerceCart, CommerceOrder, CommerceProduct, ProviderKind } from "../../domain/types.js";

export interface InventoryAdjustment {
  tenantId: string;
  productId: string;
  delta: number;
  expectedVersion: number;
  idempotencyKey: string;
}

export interface CommerceProvider {
  readonly kind: ProviderKind;
  listProducts(tenantId: string): Promise<CommerceProduct[]>;
  createCart(tenantId: string, productId: string, quantity: number): Promise<CommerceCart>;
  adjustInventory(input: InventoryAdjustment): Promise<CommerceProduct>;
  listOrders(tenantId: string): Promise<CommerceOrder[]>;
  getConnectionStatus(): Promise<{ provider: ProviderKind; connectionState: "disconnected" | "connected"; gate: "closed" }>;
}
