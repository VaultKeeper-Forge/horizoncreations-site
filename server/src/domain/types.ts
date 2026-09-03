export type ProductState = "available" | "made_to_order" | "sold" | "gallery_only";
export type FulfillmentModel = "finished_stock" | "made_to_order" | "gallery_only";
export type ProviderKind = "mock" | "shopify";
export type ApprovalStatus = "pending" | "approved" | "consumed" | "expired";

export interface Tenant {
  id: string;
  name: string;
  currency: string;
  storefrontOrigin: string;
  provider: ProviderKind;
  connectionState: "disconnected" | "connected";
}

export interface CommerceProduct {
  id: string;
  tenantId: string;
  title: string;
  sku: string;
  state: ProductState;
  fulfillmentModel: FulfillmentModel;
  priceCents: number;
  currency: string;
  quantity: number | null;
  publicCheckout: false;
  source: string;
  leadTime: string | null;
  providerProductId: string | null;
  version: number;
}

export interface CartLine {
  productId: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CommerceCart {
  id: string;
  tenantId: string;
  lines: CartLine[];
  checkoutUrl: string;
  provider: ProviderKind;
}

export interface CommerceOrder {
  id: string;
  tenantId: string;
  providerOrderId: string;
  status: "open" | "fulfilled" | "cancelled" | "refunded";
  paymentStatus: "unpaid" | "paid" | "refunded";
  fulfillmentStatus: "unfulfilled" | "partial" | "fulfilled";
  lineCount: number;
  totalCents: number;
  currency: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  action: "inventory.adjust" | "product.publish" | "order.update";
  resourceId: string;
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  requestHash: string;
  beforeStateHash: string;
  status: ApprovalStatus;
}

export interface Receipt {
  id: string;
  workOrderId: string;
  tenantId: string;
  action: string;
  actor: string;
  provider: ProviderKind;
  idempotencyKey: string | null;
  approvalId: string | null;
  beforeStateHash: string;
  afterStateHash: string;
  outcome: "success" | "blocked" | "replayed";
  createdAt: string;
  summary: Record<string, unknown>;
}

export interface OperationsSnapshot {
  tenant: Pick<Tenant, "id" | "name" | "currency" | "connectionState" | "provider">;
  gate: "closed";
  publicCheckout: false;
  inventory: Array<Pick<CommerceProduct, "id" | "title" | "sku" | "state" | "quantity" | "fulfillmentModel">>;
  openApprovals: number;
  recentReceipts: number;
}
