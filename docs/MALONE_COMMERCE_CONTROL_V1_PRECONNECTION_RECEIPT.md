# Malone Commerce Control V1 — Pre-connection Receipt

| Field | Readback |
| --- | --- |
| Work order | `MCC-HORIZON-RIVET-2026-09-03-001` |
| Actor | `RIVET` |
| Package pointer | `53ee0bc20514524be1653437b9e28a3655aa7863` |
| Source ZIP SHA-256 | `370982d5dd4017febb8918977004ef87ba29dba5243b663f2460dc58b2aafd40` |
| Implemented package commit | `a4d97bb69e41c680012b32743c9a7163a3b5c41f` |
| Review artifact | Draft PR [#2](https://github.com/VaultKeeper-Forge/horizoncreations-site/pull/2) |
| Result state | `READY_AT_SHOPIFY_CONNECTION_GATE` |
| Shopify connection gate | `CLOSED` |
| Public checkout | `OFF` |

## Implemented, tested, and read back

- The Horizon V2 source was reconciled into the isolated activation branch; the existing V2 site source and its maker-focused identity remain the public artifact baseline.
- `server/` implements a TypeScript Fastify control plane with deterministic mock provider, disabled Shopify adapter, owner mutation prepare/approve/execute flow, state hashes, idempotency, audit receipts, tenant guardrails, MCP Streamable HTTP surface, and HMAC/replay primitives.
- `server/migrations/0001_control_plane.sql` created the tenant-scoped operational schema in an isolated PostgreSQL container. The migration completed; six required operational tables were present in the check and twelve tenant-scoped tables had RLS enabled.
- The second synthetic tenant, Copper Finch Studio, is present only to prove tenant isolation. The automated test rejects its product identifier through the Horizon tenant scope.
- Horizon catalog truth is seeded exactly: Heresy Journal is `AVAILABLE`, one finished-stock unit, `$75`, SKU `HC-HJ-001`; Everyday Carry Pouch is `MADE TO ORDER`, `$85`, SKU `HC-ECP-001`, and has no shelf quantity; Banzai, Turtles, and Green Mushroom journals are `SOLD`, gallery-only, and rejected by cart logic.
- A default Horizon V2 build emits disabled commerce controls and no mock endpoint. A separately built local-only mock preview creates a deterministic mock cart and states plainly that no payment, shipping purchase, or public checkout is active.
- Owner connection packet, compose file, Cloud Run template, environment template, architecture document, server README, and non-deploy CI workflow are included.

## Verification results

- Server test suite: `9/9` passed, including inventory truth, sold rejection, approval binding, idempotent replay, tenant isolation, owner access control, closed webhook route, disabled Shopify adapter, MCP catalog, and webhook HMAC/replay behavior.
- Typecheck, production build, MCP descriptor inspection, and secret scan passed. The descriptor contains twelve named tools; the scan returned zero findings.
- The service container built successfully and, in a temporary local container, returned `/health = ok`, provider `mock`, gate `closed`, and `/ready.publicCheckout = false`.
- Horizon V2 build and verification passed with zero forbidden public paths and zero internal-link failures. Its verification now asserts that the default public artifact keeps commerce disabled and omits local mock details.
- Browser smoke tests passed on the local Horizon artifact at desktop and iPhone-width. The private mock cart endpoint returned `201`; production-mode UI showed a disabled control and no local mock endpoint; browser console had zero errors/warnings; mobile readback found no horizontal overflow and no loaded-image failures after lazy assets were exercised.
- Draft PR [#2](https://github.com/VaultKeeper-Forge/horizoncreations-site/pull/2) was read back as open, mergeable, and draft. Its pre-connection verification workflow run `33810055431` completed successfully.

## Explicitly not performed

No Shopify login, account access, custom-app installation, credential collection/storage, token exchange, API request, provider object creation, webhook subscription, payment setup, live checkout, public buy button activation, DNS change, or production deployment occurred. No customer, payment, or production order data was used.

## Owner gate

The next bounded action is only the explicit owner opening of the Shopify Connection Gate against this exact package/PR, followed by the checklist in [`SHOPIFY_CONNECTION_PACKET.md`](../infrastructure/runbooks/SHOPIFY_CONNECTION_PACKET.md). Shipping, tax, policy, payout, OAuth, store scope, secret-manager, and public-canary decisions remain owner/deployment gates; they were not invented here.
