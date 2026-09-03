import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CommerceConfig, readConfig } from "../config/config.js";
import { requireOwner } from "../auth/owner-auth.js";
import { CommerceError } from "../domain/errors.js";
import { CommerceService } from "../services/commerce-service.js";
import { createCommerceMcpServer } from "../mcp/server.js";
import { approvalSchema, cartSchema, inventoryExecuteSchema, inventoryPrepareSchema } from "./schemas.js";

export async function buildApp(options: { config?: CommerceConfig; service?: CommerceService } = {}) {
  const config = options.config ?? readConfig();
  const service = options.service ?? new CommerceService();
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });

  await app.register(helmet, { contentSecurityPolicy: false, global: true });
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || config.storefrontOrigins.includes(origin)) callback(null, true);
      else callback(null, false);
    },
    methods: ["GET", "POST"],
  });
  await app.register(rateLimit, { global: true, max: 120, timeWindow: "1 minute" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof CommerceError) return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
    if (typeof error === "object" && error !== null && "issues" in error) {
      return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "The request failed validation." } });
    }
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "The commerce control service could not complete the request." } });
  });

  app.get("/health", async () => ({ status: "ok", service: "malone-commerce-control", provider: "mock", gate: "closed" }));
  app.get("/ready", async () => ({ ready: true, provider: "mock", shopifyConnectionGate: "closed", publicCheckout: false }));

  app.get("/.well-known/oauth-protected-resource", async () => ({ resource: "/mcp", authorization_servers: ["/.well-known/oauth-authorization-server"], bearer_methods_supported: ["header"] }));
  app.get("/.well-known/oauth-authorization-server", async () => ({ issuer: "malone-commerce-control", authorization_endpoint: null, token_endpoint: null, grant_types_supported: ["authorization_code"], status: "OAUTH_CONFIGURATION_REQUIRED_AT_DEPLOYMENT" }));

  app.get("/api/v1/storefront/catalog", async () => {
    const products = await service.listProducts();
    return {
      provider: "mock",
      publicCheckout: false,
      products: products.map(({ id, title, sku, state, fulfillmentModel, priceCents, currency, quantity, leadTime }) => ({ id, title, sku, state, fulfillmentModel, priceCents, currency, quantity, leadTime, purchasableInMock: state !== "sold" })),
    };
  });

  app.post("/api/v1/storefront/cart", async (request, reply) => {
    const input = cartSchema.parse(request.body);
    const cart = await service.createMockCart(input.productId, input.quantity);
    return reply.code(201).send({ cart, checkout: { mode: "mock", safeUrl: cart.checkoutUrl, publicCheckout: false } });
  });

  app.get("/api/v1/owner/commerce-status", async (request) => {
    requireOwner(request.headers, config);
    return service.operationsSnapshot();
  });

  app.post("/api/v1/owner/inventory/prepare", async (request) => {
    const principal = requireOwner(request.headers, config);
    const input = inventoryPrepareSchema.parse(request.body);
    return service.prepareInventoryAdjustment({ ...input, actor: principal.subject });
  });

  app.post("/api/v1/owner/approvals/:approvalId/approve", async (request) => {
    const principal = requireOwner(request.headers, config);
    const approvalId = approvalSchema.parse({ approvalId: (request.params as { approvalId?: string }).approvalId }).approvalId;
    return service.approveMutation(approvalId, principal.subject);
  });

  app.post("/api/v1/owner/inventory/execute", async (request) => {
    const principal = requireOwner(request.headers, config);
    const input = inventoryExecuteSchema.parse(request.body);
    return service.executeInventoryAdjustment({ ...input, actor: principal.subject });
  });

  app.post("/webhooks/shopify", async (_request, reply) => reply.code(503).send({ error: { code: "SHOPIFY_CONNECTION_REQUIRED", message: "The Shopify webhook endpoint is deliberately disabled while the connection gate is closed." } }));

  app.post("/mcp", async (request, reply) => {
    requireOwner(request.headers, config);
    const mcp = createCommerceMcpServer(service);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await mcp.connect(transport);
    reply.hijack();
    await transport.handleRequest(request.raw, reply.raw, request.body);
  });

  return app;
}
