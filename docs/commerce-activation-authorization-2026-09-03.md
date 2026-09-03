# Horizon Creations Commerce Activation Authorization

Date: 2026-09-03
Owner authorization: Curtis explicitly directed Forge to press through the e-shop setup and finish Horizon Creations with an e-store for selling leather goods.

## Boundaries

- Keep the existing Horizon custom storefront and Living Workbench identity.
- Use Shopify as the commerce backend for checkout, payments, inventory, shipping, returns, and orders.
- Do not replace the public Horizon site with a generic Shopify theme.
- Preserve sold pieces as portfolio/gallery proof; do not make sold one-off pieces purchasable.
- Heresy Journal is the first finished shelf-item commerce canary: price $75.00, quantity 1, SKU HC-HJ-001.
- Everyday Carry Pouch is a made-to-order product at $85.00 starting price; it may be wired for commerce only with inventory/fulfillment semantics that do not falsely imply a finished shelf unit.
- Product publication remains gated on Shopify payment, shipping, tax, inventory, checkout, and return-policy verification.
- Never commit Shopify credentials or tokens to the repository.

## Required verification before public checkout

1. Shopify store/account exists and owner access is confirmed.
2. Admin and Storefront credentials are installed only in the secure runtime/CI environment.
3. Shipping origin, domestic shipping profile, package weight/dimensions, return/refund policy, contact policy, and tax settings are confirmed.
4. Heresy is exported as a Shopify draft and read back by product ID/SKU/price/quantity.
5. Storefront checkout/cart wiring is implemented against the verified Shopify product/variant IDs.
6. A test checkout reaches Shopify securely and displays correct item, price, shipping, and tax behavior without placing an unintended live order.
7. Mobile/desktop accessibility and sold/made-to-order states are regression-checked.
8. Only after readback passes may the buy path be made public.

This file records owner authorization. It is not evidence that Shopify onboarding, product creation, checkout, payment processing, or public commerce has completed.
