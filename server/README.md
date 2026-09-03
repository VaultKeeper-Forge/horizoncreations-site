# Malone Commerce Control V1

This service is the disconnected Horizon commerce control plane. It uses a deterministic mock provider for local preview and tests. It has no pre-gate Shopify network operation path, no payment handling, and no public checkout.

## Local verification

1. `npm ci`
2. `npm run typecheck`
3. `npm run test`
4. `npm run mcp:inspect`
5. `npm run secret:scan`

`npm run dev` starts only the local mock service. The storefront remains disabled unless its own static build is explicitly created with `HORIZON_COMMERCE_MODE=mock` for a private preview.

## Safety model

- `COMMERCE_PROVIDER=mock`, `SHOPIFY_CONNECTION_GATE=closed`, and `PUBLIC_CHECKOUT=off` are literal configuration requirements.
- The production configuration refuses `OWNER_AUTH_MODE=local-test`.
- Owner mutations are prepare → authenticated owner approval → exact-bound execution, with idempotency and a receipt.
- Tenant boundaries exist in the control-plane implementation and PostgreSQL row-level security migration.
- The Shopify adapter returns `SHOPIFY_CONNECTION_REQUIRED` for every provider operation until a separately authorized connection phase.
- The webhook verifier accepts only raw-body HMACs and prevents duplicate events; the HTTP webhook route intentionally returns `503` while the gate is closed.

## Deliberate connection boundary

Do not place Shopify, payment, tax, shipping, OAuth, or database credentials in this repository. See [`infrastructure/runbooks/SHOPIFY_CONNECTION_PACKET.md`](../infrastructure/runbooks/SHOPIFY_CONNECTION_PACKET.md) for the exact owner inputs and connection readback required before the next phase.
