# Malone Commerce Control V1 — Rivet Build Package Pointer

**Execution state:** READY FOR RIVET BUILD  
**Work order:** `MCC-HORIZON-RIVET-2026-09-03-001`  
**Authoritative branch:** `commerce/shopify-activation-20260903`  
**GitHub issue:** #1 — Activate Horizon Shopify e-store and verified checkout  
**Shopify Connection Gate:** **CLOSED**

## Authoritative package

- Master readable document: https://docs.google.com/document/d/1CuNx9TY_f5z7MA4dt90grQmvlke5X3jDPKjERfACutk/edit
- Full modular ZIP: https://drive.google.com/file/d/1Lz3u-mPfXObvvdxQpqiFDTPAlQdqZ0k2/view
- ZIP SHA-256: `370982d5dd4017febb8918977004ef87ba29dba5243b663f2460dc58b2aafd40`

## Rivet authority

Rivet may inspect, design, scaffold, code, test, package, containerize, document, and prepare deployment through the pre-Shopify build without pausing for intermediate approval.

## Hard stop

Do **not** connect to the real Shopify account, request or store credentials, install the Shopify app, exchange tokens, enable Shopify Payments, create real provider objects, subscribe real webhooks, change live checkout, expose public buy buttons, or change DNS until Curtis explicitly opens the Shopify Connection Gate against the exact package commit and scope.

Rivet should stop at `READY_AT_SHOPIFY_CONNECTION_GATE` with the required software evidence, draft PR, test results, container/hosting evidence, second-tenant proof, secret scan, and one bounded owner connection packet.

Read the master package before writing. The ZIP contains the modular source documents and machine-readable MCP tool contracts.
