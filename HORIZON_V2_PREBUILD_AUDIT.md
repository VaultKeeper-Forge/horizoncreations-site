# Horizon Creations V2 Prebuild Audit

## Receipt

- TIMESTAMP: 2026-08-29
- ACTOR: RIVET
- WORK_ORDER: RIVET WORK ORDER — HORIZON CREATIONS V2 FULL SITE REBUILD
- PHASE: 0 — PREBUILD / SAFETY
- STATE: VERIFIED_COMPLETE
- TARGET: horizoncreations.art

## Current public state

The current public site is a static GitHub Pages deployment built from the repository root. The deploy workflow uploads `.` after running the legacy generator. That exposes intended site files and unintended source/internal material through the public domain.

Confirmed current public exposure includes build source, package metadata, product-staging JSON, internal markdown, raw intake media, and original STL binaries. The V2 deploy must never publish the repository root.

The current local worktree also contains unfinished changes that predate V2. They include correct sold-state updates for Banzai, Turtles, and Green Mushroom; newer Heresy approval state; generated-page edits; Vault work; and unrelated operational documents. V2 will preserve that state and build beside it rather than reset, clean, or delete it.

## Public output boundary

V2 will generate into:

- `dist/client/` — the complete allowlisted public static site.
- `dist/server/` — the minimal Sites-compatible worker entrypoint.
- `dist/.openai/hosting.json` — copied hosting metadata for packaging.

GitHub Pages must upload only `dist/client/`. Sites packaging must package only supported build output and hosting metadata. The build will fail if an unexpected top-level public path is present.

## Preserve

### Brand and voice

- Horizon Creations name.
- Core line: “Handmade leather goods built to get used.”
- Plainspoken, bench-first maker voice.
- Northern California workshop grounding.
- Warm leather, charcoal, bone, copper, oxblood, and restrained brass palette.
- Standard / custom / workbench distinctions where they help customers understand the work.

### Content and evidence

- Real finished-piece photography.
- Heresy Journal as the confirmed available finished piece at $75 shipped domestic.
- Everyday Carry Pouch as a repeatable made-to-order pattern at $85.
- Banzai, Turtles, and Green Mushroom journals as sold work in the Past Pieces gallery.
- Tree of Life, Sea Turtle, Blue Scale, Heresy panel, and pattern-ledger work as custom examples.
- Bracelet runs, dye work, tools, impressions, forms, and in-progress photography as process evidence.
- Leatherworker stamp/STL lane as a secondary bench-adjacent offering.
- Existing social destinations, but only in the footer or contextually relevant secondary areas.
- Existing photo-lightbox affordance where it improves product inspection.

### Internal/nonpublic material

- Vault Compiler source and evidence.
- Shopify, Meta, Discord, affiliate, and outreach tooling.
- Raw social-intake material.
- Original high-resolution photographs.
- Original STL files.
- Existing docs, receipts, and proof artifacts.

These items are preserved locally but excluded from V2 public output.

## Remove from the Horizon public lane

- Vault Compiler promo, route, assets, and identity.
- General AI/software and Malone technology identity.
- Follower counts, page-hit badges, and vanity statistics.
- Tip-jar prominence.
- Discord prominence.
- Homepage social directory.
- Affiliate tracking script.
- “Built with AI” customer-facing disclaimer.
- Nine-item pill navigation.
- Dashboard-like grids that give every peripheral lane equal weight.
- Repeated category blocks and repeated social calls to action.
- Sold items represented as available.
- Public access to source, staging data, docs, raw media, and original STL files.

## Relocate

- Social links → minimal footer.
- STL/stamp packs → “Tools for Leatherworkers,” below finished and custom leather work.
- Sold products → Past Pieces gallery with explicit SOLD state.
- Bench experiments → Workbench route and selected process sequence.
- Detailed custom-order expectations → Custom Work route.
- General maker story → About route and short homepage excerpt.
- Internal technology, Vault, automation, affiliate, and operations material → local/private repository lanes only.

## Reusable Horizon-safe asset inventory

The current repository contains enough authentic photography for V2 without stock imagery or synthetic product shots. Primary candidates:

- Grouped finished journals for the hero and material opening.
- Heresy Journal full and detail views.
- Everyday Carry Pouch full and detail views.
- Tree of Life Pair.
- Sea Turtle Journal Cover.
- Heresy Panel Run.
- Blue Scale Finish Study.
- Bracelet full-set, dye, hardware, tooling, and bench-detail photos.
- Tooling-block first impressions and Tree of Life close detail.

The selected public derivatives will be resized, auto-oriented, stripped of unnecessary metadata, and encoded as responsive WebP/JPEG assets. Originals remain untouched.

## Inventory truth model

Every public product record must resolve to exactly one state:

- `AVAILABLE` — a confirmed physical item may be purchased now.
- `RESERVED` — held for a named customer or pending completion/payment.
- `MADE TO ORDER` — repeatable pattern, not represented as ready-to-ship stock.
- `SOLD` — archive/capability proof only.

V2 initial mapping from current local evidence:

| Piece | V2 public state | Basis |
| --- | --- | --- |
| Heresy Journal | AVAILABLE | Quantity 1; approved local state; current local homepage copy says still on hand. |
| Everyday Carry Pouch | MADE TO ORDER | Repeatable pattern and sellable staging record; not approved as ready-to-ship inventory. |
| Banzai Journal | SOLD | Sold in person 2026-05-30; quantity 0; hold. |
| Turtles Journal | SOLD | Sold in person 2026-05-30; quantity 0; hold. |
| Green Mushroom Journal | SOLD | Sold in person 2026-05-30; quantity 0; hold. |

Custom examples remain portfolio work, not inventory.

## Missing and needed

- Clean `dist` build and allowlist validator.
- Responsive image derivatives and reusable `<picture>` patterns.
- Product-detail pages for Heresy Journal and Everyday Carry Pouch.
- A compact mobile navigation pattern.
- Canonical, Open Graph, X, and structured-data metadata.
- `robots.txt`, `sitemap.xml`, custom `404.html`, and proper favicon assets.
- One validated Horizon V2 social-preview image.
- Automated route, internal-link, public-boundary, inventory-state, and payload checks.
- Desktop/mobile rendered proof and Lighthouse comparison.
- A clear custom inquiry handoff that retains the chosen piece/context.

## Phase 0 gate

Phase 0 passes. The rebuild can proceed without deleting or rewriting internal evidence. The safe implementation path is a new allowlisted V2 generator and public output, preserving the legacy mixed workspace as nonpublic source/history.
