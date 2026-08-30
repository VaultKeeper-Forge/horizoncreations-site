# Horizon Creations V2 Brand Lock

## Receipt

- TIMESTAMP: 2026-08-29
- ACTOR: RIVET
- WORK_ORDER: RIVET WORK ORDER — HORIZON CREATIONS V2 FULL SITE REBUILD
- PHASE: 1 — BRAND + STRUCTURE LOCK
- STATE: VERIFIED_COMPLETE

## Brand concept

### The Living Workbench

The site feels like a visitor has stepped into a working leather shop and the bench is quietly guiding them from raw material to finished piece.

It is tactile, warm, grounded, inventive, and unmistakably handmade. Modern execution is visible in the precision, speed, responsive behavior, and subtle motion—not in software visuals or technology copy.

## Core line

> Handmade leather goods built to get used.

Supporting line:

> Built at my bench in Northern California. Real leather, real marks, and pieces made for the life they pick up along the way.

## Primary navigation

Exactly five items:

1. Shop
2. Custom Work
3. Workbench
4. About
5. Contact

The wordmark returns home. Mobile uses a compact menu control; the collapsed menu never consumes the first viewport.

## Route architecture

- `/` — signature homepage and primary customer funnel.
- `/shop/` — available and made-to-order products first; sold archive second.
- `/shop/heresy-journal/` — available-piece detail.
- `/shop/everyday-carry-pouch/` — made-to-order detail.
- `/custom-work/` — examples and approachable request process.
- `/workbench/` — the deeper process and tools story.
- `/about/` — concise maker story.
- `/contact/` — focused inquiry paths and what to send.

Legacy art routes may redirect to their V2 equivalents, but no Vault or unrelated internal route is included in the public artifact.

## Homepage sequence

1. Photographic hero with Horizon identity, core line, support line, and two CTAs.
2. Material introduction: real leather, natural variation, handwork, useful modern tools.
3. Available Pieces: Heresy Journal and made-to-order Everyday Carry Pouch with large photography, state, price, and direct action.
4. Custom Work: approachable five-step flow and selected one-off proof.
5. Living Workbench process: raw hide → cut → mark → dye → stitch → finished piece.
6. Tools for Leatherworkers: secondary, compact, bench-adjacent.
7. Past Pieces: Banzai, Turtles, and Green Mushroom explicitly SOLD.
8. About Horizon: short maker-first story.
9. Final custom/contact CTA.
10. Minimal footer.

## Visual system

### Color

- Charcoal: `#15120f`
- Warm black: `#0d0b09`
- Burnished leather: `#6f3f26`
- Saddle copper: `#c87335`
- Bone: `#f2eadc`
- Parchment: `#d9cab8`
- Oxblood: `#6e2228`
- Restrained brass: `#b79558`

Color temperature warms as the homepage moves from material/process toward completed work. Transitions are gradual and photographic, not hard section-color switches.

### Type

- Editorial serif for display: Fraunces with a Georgia fallback.
- Clean sans for UI/body: Inter with a system sans fallback.
- Serif carries material and authorship; sans carries clarity and modern execution.

### Photography

- Product images lead the composition.
- Hero and product frames are large and allowed to crop intentionally.
- Detail photography emphasizes grain, tooling, edges, dye, hardware, and hands-on process.
- Responsive sources prevent originals from being shipped to small screens.

### Signature stitch line

- A restrained dashed copper line travels through the homepage process sequence.
- It frames selected transitions and connects making steps.
- One subtle draw/reveal animation is allowed when motion preference permits.
- It does not surround every card or become decorative noise.

### Surfaces

- Broad editorial sections, image wells, material bands, and asymmetric compositions.
- Limited use of bordered cards only where a product or discrete decision needs containment.
- Minimal pills: product state and small metadata only.

## Motion system

- CSS-first reveal and image-shift behavior.
- Small parallax-like image movement using transform only where it remains stable and optional.
- Stitch-line draw on selected process blocks.
- No scroll hijacking, loading gate, bouncing cards, cursor effects, or motion-dependent comprehension.
- `prefers-reduced-motion` disables all nonessential movement.

## Inventory display law

- State label is mandatory and text-based.
- AVAILABLE gets the clearest purchase/inquiry action.
- MADE TO ORDER explains that the shown piece is a pattern/example, not ready-to-ship stock.
- SOLD lives in Past Pieces and never uses purchase language.
- RESERVED remains visible only when useful and cannot use an available CTA.
- Product state is stored once in the V2 catalog and used by homepage, shop, details, sitemap, and structured data.

## Copy lock

Voice is plainspoken, confident, maker-first, and lightly playful.

Approved examples:

- “Built at my bench in Northern California.”
- “Every piece picks up marks. That’s kind of the point.”
- “Have something strange in mind? Those are usually the fun ones.”
- “Real leather changes as you use it. I build for that.”

Disallowed voice:

- Luxury perfume language.
- Generic craft-template copy.
- Software launch language.
- AI/technology self-congratulation.

## Acceptance lock

The V2 build must remain recognizably Horizon even if the logo is hidden: large authentic leather photography, a warm material palette, editorial serif, restrained copper stitch motif, maker-first copy, honest inventory, and a clear path to available or custom work.
