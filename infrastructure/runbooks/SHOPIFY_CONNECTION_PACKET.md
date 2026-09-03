# Horizon Shopify Connection Packet — owner action required

**Work order:** `MCC-HORIZON-RIVET-2026-09-03-001`
**Package pointer:** `53ee0bc20514524be1653437b9e28a3655aa7863`
**State:** `READY_AT_SHOPIFY_CONNECTION_GATE` only after the associated PR readback passes.
**Current provider state:** mock / disconnected. No Shopify account or credentials were accessed for this package.

## What Curtis must decide or provide at the gate

1. Authorize the exact Shopify store and the account holder who can install the custom app.
2. Confirm the shipping origin, domestic and international zones, carrier/service choices, package dimensions and weights, handling time, rates or free-shipping threshold, and the return/refund policy.
3. Confirm tax registrations, markets, payout owner, settlement currency, support email, privacy/policy URLs, and final legal business identity exactly as they should appear to a customer.
4. Confirm the inventory sheet for all pieces. The current seed truth is Heresy Journal `AVAILABLE` (one finished piece at `$75`), Everyday Carry Pouch `MADE TO ORDER` (from `$85`, no shelf count), and Banzai / Turtles / Green Mushroom journals `SOLD` (never purchasable).
5. Approve a least-privilege custom-app scope list in the live Shopify UI after its current scope names are read back. The proposed categories are product, inventory, order, and fulfillment read/write only; do not authorize customer, payment, billing, or storefront token scope unless a later approved implementation proves it is needed.
6. Provide the final deployed service origin, OAuth issuer/audience/JWKS configuration, and secret-manager references. They are intentionally `REQUIRED_AT_DEPLOYMENT` today.

## Connection sequence after an explicit owner opening

1. Read this packet and the merged package commit back to Curtis.
2. In Curtis's authenticated Shopify session, create or select the approved custom app and record the exact store, scopes, API version, and secret-manager reference IDs—never raw values—in the connection receipt.
3. Configure production OAuth/JWKS validation and the final service origin. Confirm owner endpoint rejects unauthenticated and wrong-audience bearer tokens.
4. Place provider secret references in the deployment secret manager; do not commit or copy tokens into source, logs, issue comments, or chat.
5. Run the PostgreSQL migration under the dedicated service identity and confirm tenant RLS using both Horizon and the synthetic Copper Finch tenant.
6. Configure HMAC-validated webhooks only after the provider connection is verified. Record exact enabled topics and the replay/event-ID readback.
7. Load only the owner-approved products. Check SKU, price, available inventory, sold exclusion, product status, collections, image ownership, shipping fields, and public visibility before publishing anything.
8. Configure shipping, tax, policy, and payout details in Shopify. Verify these with a non-public test order or provider test mode where available; no public canary until Curtis explicitly authorizes it.
9. Run one controlled Horizon canary after owner approval: product selection, cart, shipping estimate, tax, checkout, payment test mode, order receipt, webhook, idempotency, fulfillment state, and rollback. Record every result.
10. Only after the end-to-end canary and a fresh owner readback may a separate work order consider enabling public purchase controls.

## Explicitly not done by this package

- No Shopify authentication, app install, token exchange, API call, provider object, webhook subscription, payment configuration, live checkout, public buy button, DNS, or production deploy.
- No shipping, tax, legal, payout, or return-policy decision was invented.
- No customer, order, payment, or account data exists in the mock fixtures.
