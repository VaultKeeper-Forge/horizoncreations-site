# Malone Commerce Control V1 — pre-connection architecture

## Purpose and current boundary

Horizon Creations is a Malone Integrated Technologies client storefront. This package adds a self-contained commerce-control service while preserving the existing static Horizon V2 site and its maker-first voice. The service is deliberately disconnected: mock provider only, Shopify gate closed, public checkout off.

## Components

| Component | Responsibility | Current state |
| --- | --- | --- |
| Horizon V2 static site | Product discovery and disabled commerce controls | Built from the V2 catalog; public purchase remains unavailable |
| Commerce client | Optional local mock-cart interaction | Does nothing in the default public artifact |
| Fastify API | Health/readiness, storefront mock catalog/cart, owner control plane, MCP transport | Tested locally |
| Control plane | Product truth, approvals, idempotency, audit receipts, tenant guards | Deterministic mock implementation |
| PostgreSQL migration | Durable tenant-scoped operational records with RLS | Prepared; not applied to a production database |
| Mock provider | Deterministic cart and test data | Active for local tests only |
| Shopify adapter | Provider contract and hard failure boundary | All operations return `SHOPIFY_CONNECTION_REQUIRED` |
| MCP server | Twelve read/control tools over Streamable HTTP | Descriptor generated and inspected locally |

## Data and tenant controls

The seed includes Horizon Creations plus an unrelated synthetic tenant, Copper Finch Studio. Requests use tenant-scoped lookups; a Copper Finch identifier cannot be read through Horizon. The production migration applies the same tenant boundary with `app.tenant_id` transaction scope and forced PostgreSQL row-level security.

The inventory rule is literal:

- Finished stock must have a nonnegative quantity.
- Made-to-order and gallery-only work have no shelf quantity.
- Sold work is gallery-only and cannot enter a cart.
- Every control-plane product record has `public_checkout=false`.

## Mutation control

Inventory changes require a prepare request that records an exact before-state hash, authenticated owner approval, and execution with that same request/current state plus an idempotency key. A successful execution returns both before/after hashes and a receipt. Replays return the original state without double-changing quantity.

## Production hardening still required after the owner gate

Deployment must use a dedicated database identity, secret-manager references, verified OAuth bearer tokens, TLS ingress, final origin allowlisting, backups, monitoring, and an explicit owner-approved Shopify configuration. These are not claimed as active by this pre-connection package.
