import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CommerceError } from "../domain/errors.js";
import { CommerceService } from "../services/commerce-service.js";

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function failure(error: unknown) {
  if (error instanceof CommerceError) return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ code: error.code, message: error.message, details: error.details }) }] };
  return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ code: "INTERNAL_ERROR", message: "The commerce control request could not be completed." }) }] };
}

export function createCommerceMcpServer(service: CommerceService) {
  const server = new McpServer({ name: "malone-commerce-control", version: "0.1.0" });
  const owner = "curtis-owner-test";

  server.registerTool("get_horizon_operations_snapshot", {
    title: "Get Horizon operations snapshot",
    description: "Read the current disconnected Horizon commerce control state without customer or payment data.",
    annotations: { readOnlyHint: true },
  }, async () => result(await service.operationsSnapshot()));

  server.registerTool("list_horizon_products", {
    title: "List Horizon products",
    description: "Read normalized catalog state, including sold and made-to-order truth.",
    annotations: { readOnlyHint: true },
  }, async () => result(await service.listProducts()));

  server.registerTool("get_horizon_inventory", {
    title: "Get Horizon inventory",
    description: "Read physical inventory by SKU. Made-to-order products never report false shelf quantity.",
    inputSchema: { sku: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ sku }) => {
    try { return result(await service.getInventory(sku)); } catch (error) { return failure(error); }
  });

  server.registerTool("get_horizon_product", {
    title: "Get Horizon product",
    description: "Read one normalized product record by stable internal ID.",
    inputSchema: { productId: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ productId }) => {
    try { return result(await service.getProduct(productId)); } catch (error) { return failure(error); }
  });

  server.registerTool("list_horizon_orders", {
    title: "List Horizon orders",
    description: "Read order summaries without customer PII. The disconnected mock starts with no real provider orders.",
    annotations: { readOnlyHint: true },
  }, async () => result(await service.listOrders()));

  server.registerTool("get_horizon_fulfillment_readiness", {
    title: "Get Horizon fulfillment readiness",
    description: "Read the remaining shipping, policy, tax, and canary requirements without claiming Shopify is connected.",
    annotations: { readOnlyHint: true },
  }, async () => result(service.fulfillmentReadiness()));

  server.registerTool("prepare_horizon_inventory_adjustment", {
    title: "Prepare Horizon inventory adjustment",
    description: "Capture exact current state and create a short-lived approval request. This does not mutate inventory.",
    inputSchema: { productId: z.string().min(1), delta: z.number().int().min(-100).max(100).refine((value) => value !== 0), expectedVersion: z.number().int().positive() },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  }, async (input) => {
    try { return result(service.prepareInventoryAdjustment({ ...input, actor: owner })); } catch (error) { return failure(error); }
  });

  server.registerTool("approve_horizon_mutation", {
    title: "Approve Horizon mutation",
    description: "Consume an authenticated owner approval step for the exact prepared request.",
    inputSchema: { approvalId: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  }, async ({ approvalId }) => {
    try { return result(service.approveMutation(approvalId, owner)); } catch (error) { return failure(error); }
  });

  server.registerTool("execute_horizon_inventory_adjustment", {
    title: "Execute Horizon inventory adjustment",
    description: "Execute only an exact approved inventory adjustment in the deterministic mock, then return a receipt and after-state readback.",
    inputSchema: { productId: z.string().min(1), delta: z.number().int().min(-100).max(100).refine((value) => value !== 0), expectedVersion: z.number().int().positive(), approvalId: z.string().min(1), idempotencyKey: z.string().min(12).max(160) },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  }, async (input) => {
    try { return result(service.executeInventoryAdjustment({ ...input, actor: owner })); } catch (error) { return failure(error); }
  });

  for (const [name, title, description] of [
    ["prepare_horizon_product", "Prepare Horizon product", "Return the disconnected product-plan boundary; provider product creation is unavailable until the Shopify gate opens."],
    ["publish_horizon_product", "Publish Horizon product", "Fail closed: public product publication is disabled until Shopify, checkout, shipping, tax, and policy readback pass."],
    ["update_horizon_order_state", "Update Horizon order state", "Fail closed: no provider order exists while Shopify is disconnected."],
  ] as const) {
    server.registerTool(name, { title, description, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true } }, async () => result({ code: "SHOPIFY_CONNECTION_REQUIRED", gate: "closed", publicCheckout: false }));
  }

  return server;
}
