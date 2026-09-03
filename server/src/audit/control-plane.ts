import { randomUUID } from "node:crypto";
import { stableHash } from "./hash.js";
import { forbidden, notFound } from "../domain/errors.js";
import { horizonTenant, initialProducts, syntheticTenant } from "../domain/catalog.js";
import type { ApprovalRequest, CommerceOrder, CommerceProduct, Receipt, Tenant } from "../domain/types.js";

interface IdempotencyRecord {
  requestHash: string;
  receipt: Receipt;
  product: CommerceProduct;
}

export class InMemoryControlPlane {
  private readonly tenants = new Map<string, Tenant>([[horizonTenant.id, horizonTenant], [syntheticTenant.id, syntheticTenant]]);
  private readonly products = new Map(initialProducts.map((product) => [product.id, structuredClone(product)]));
  private readonly approvals = new Map<string, ApprovalRequest>();
  private readonly receipts: Receipt[] = [];
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly orders: CommerceOrder[] = [];

  listTenants(): Tenant[] {
    return [...this.tenants.values()].map((tenant) => structuredClone(tenant));
  }

  getTenant(tenantId: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw notFound("TENANT_NOT_FOUND", "The requested tenant does not exist.", { tenantId });
    return structuredClone(tenant);
  }

  listProducts(tenantId: string): CommerceProduct[] {
    this.getTenant(tenantId);
    return [...this.products.values()].filter((product) => product.tenantId === tenantId).map((product) => structuredClone(product));
  }

  getProduct(tenantId: string, productId: string): CommerceProduct {
    const product = this.products.get(productId);
    if (!product || product.tenantId !== tenantId) throw notFound("PRODUCT_NOT_FOUND", "The requested product does not exist for this tenant.", { tenantId, productId });
    return structuredClone(product);
  }

  getProductBySku(tenantId: string, sku: string): CommerceProduct {
    const product = this.listProducts(tenantId).find((entry) => entry.sku === sku);
    if (!product) throw notFound("PRODUCT_NOT_FOUND", "The requested SKU does not exist for this tenant.", { tenantId, sku });
    return product;
  }

  listOrders(tenantId: string): CommerceOrder[] {
    this.getTenant(tenantId);
    return this.orders.filter((order) => order.tenantId === tenantId).map((order) => structuredClone(order));
  }

  createApproval(input: Omit<ApprovalRequest, "id" | "requestedAt" | "expiresAt" | "status">): ApprovalRequest {
    const requestedAt = new Date();
    const approval: ApprovalRequest = {
      ...input,
      id: `apr_${randomUUID()}`,
      requestedAt: requestedAt.toISOString(),
      expiresAt: new Date(requestedAt.getTime() + 5 * 60 * 1000).toISOString(),
      status: "pending",
    };
    this.approvals.set(approval.id, approval);
    return structuredClone(approval);
  }

  approve(approvalId: string, ownerSubject: string): ApprovalRequest {
    if (ownerSubject !== "curtis-owner-test") throw forbidden("OWNER_AUTH_REQUIRED", "A verified owner identity is required to approve a mutation.");
    const approval = this.approvals.get(approvalId);
    if (!approval) throw notFound("APPROVAL_NOT_FOUND", "The approval request does not exist.", { approvalId });
    if (approval.status !== "pending") throw forbidden("APPROVAL_NOT_PENDING", "The approval request cannot be approved in its current state.", { approvalId, status: approval.status });
    if (Date.parse(approval.expiresAt) <= Date.now()) {
      approval.status = "expired";
      throw forbidden("APPROVAL_EXPIRED", "The approval request expired before it was approved.", { approvalId });
    }
    approval.status = "approved";
    return structuredClone(approval);
  }

  consumeApproval(approvalId: string, expected: Pick<ApprovalRequest, "tenantId" | "action" | "resourceId" | "requestHash" | "beforeStateHash">): ApprovalRequest {
    const approval = this.approvals.get(approvalId);
    if (!approval) throw notFound("APPROVAL_NOT_FOUND", "The approval request does not exist.", { approvalId });
    if (approval.status !== "approved") throw forbidden("APPROVAL_NOT_APPROVED", "A current owner-approved request is required before execution.", { approvalId, status: approval.status });
    if (Date.parse(approval.expiresAt) <= Date.now()) {
      approval.status = "expired";
      throw forbidden("APPROVAL_EXPIRED", "The approval request expired before execution.", { approvalId });
    }
    for (const key of ["tenantId", "action", "resourceId", "requestHash", "beforeStateHash"] as const) {
      if (approval[key] !== expected[key]) throw forbidden("APPROVAL_BINDING_MISMATCH", "The approval is not bound to this exact request and current state.", { approvalId, key });
    }
    approval.status = "consumed";
    return structuredClone(approval);
  }

  getIdempotency(key: string, requestHash: string): IdempotencyRecord | undefined {
    const prior = this.idempotency.get(key);
    if (!prior) return undefined;
    if (prior.requestHash !== requestHash) throw forbidden("IDEMPOTENCY_CONFLICT", "This idempotency key was already used with a different request.", { key });
    return { receipt: structuredClone(prior.receipt), product: structuredClone(prior.product), requestHash: prior.requestHash };
  }

  adjustInventory(input: { tenantId: string; productId: string; delta: number; expectedVersion: number; idempotencyKey: string; approvalId: string; actor: string }): { product: CommerceProduct; receipt: Receipt; replayed: boolean } {
    const request = { tenantId: input.tenantId, productId: input.productId, delta: input.delta, expectedVersion: input.expectedVersion };
    const requestHash = stableHash(request);
    const prior = this.getIdempotency(input.idempotencyKey, requestHash);
    if (prior) return { product: prior.product, receipt: { ...prior.receipt, outcome: "replayed" }, replayed: true };

    const product = this.getProduct(input.tenantId, input.productId);
    if (product.fulfillmentModel !== "finished_stock") throw forbidden("INVENTORY_MODEL_FORBIDS_QUANTITY", "Only finished-stock products carry physical quantity.", { productId: product.id, fulfillmentModel: product.fulfillmentModel });
    if (product.version !== input.expectedVersion) throw forbidden("EXPECTED_STATE_MISMATCH", "The product changed after preparation. Create a new approval from current state.", { expectedVersion: input.expectedVersion, actualVersion: product.version });
    const beforeStateHash = stableHash(product);
    this.consumeApproval(input.approvalId, { tenantId: input.tenantId, action: "inventory.adjust", resourceId: product.id, requestHash, beforeStateHash });
    const nextQuantity = (product.quantity ?? 0) + input.delta;
    if (nextQuantity < 0) throw forbidden("NEGATIVE_INVENTORY_FORBIDDEN", "Inventory cannot be adjusted below zero.", { currentQuantity: product.quantity, delta: input.delta });
    const next = { ...product, quantity: nextQuantity, version: product.version + 1 };
    this.products.set(next.id, next);
    const receipt: Receipt = {
      id: `rcpt_${randomUUID()}`,
      workOrderId: "MCC-HORIZON-RIVET-2026-09-03-001",
      tenantId: next.tenantId,
      action: "inventory.adjust",
      actor: input.actor,
      provider: "mock",
      idempotencyKey: input.idempotencyKey,
      approvalId: input.approvalId,
      beforeStateHash,
      afterStateHash: stableHash(next),
      outcome: "success",
      createdAt: new Date().toISOString(),
      summary: { productId: next.id, sku: next.sku, priorQuantity: product.quantity, nextQuantity },
    };
    this.receipts.push(receipt);
    this.idempotency.set(input.idempotencyKey, { requestHash, receipt, product: next });
    return { product: structuredClone(next), receipt: structuredClone(receipt), replayed: false };
  }

  countOpenApprovals(tenantId: string): number {
    return [...this.approvals.values()].filter((approval) => approval.tenantId === tenantId && ["pending", "approved"].includes(approval.status)).length;
  }

  countReceipts(tenantId: string): number {
    return this.receipts.filter((receipt) => receipt.tenantId === tenantId).length;
  }

  listReceipts(tenantId: string): Receipt[] {
    return this.receipts.filter((receipt) => receipt.tenantId === tenantId).map((receipt) => structuredClone(receipt));
  }
}
