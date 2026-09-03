# Horizon Creations V2 Final Verification

**ACTOR:** RIVET

**Verified:** 2026-08-29 23:16 PDT

**Execution state:** PARTIAL — V2 is deployed and independently verified at the Sites production URL; the owner domain is attached but its Cloudflare DNS cutover is blocked on owner sign-in.

## Authority and identity boundary

- Owner work order: `RIVET WORK ORDER — HORIZON CREATIONS V2 FULL SITE REBUILD`
- Target brand: Horizon Creations, handmade leather goods and bench-built leatherworking tools.
- Excluded from the public build: Malone Integrated Tech, software/consulting, AI systems, Vault/internal tools, private docs, source scripts, credentials, and continuity artifacts.
- Core line: **Handmade leather goods built to get used.**
- Concept: **The Living Workbench.**

## Delivered routes

| Route | Live readback | Purpose |
|---|---:|---|
| `/` | 200 | Homepage and full hide-to-finish story |
| `/shop/` | 200 | Honest inventory and sold proof |
| `/shop/heresy-journal/` | 200 | Available product detail |
| `/shop/everyday-carry-pouch/` | 200 | Made-to-order product detail |
| `/custom-work/` | 200 | Custom work and process |
| `/workbench/` | 200 | Material, process, and tools |
| `/about/` | 200 | Maker story |
| `/contact/` | 200 | Contact routes and copyable brief |

Legacy public routes redirect to their V2 equivalents. A branded 404 page handles unknown paths.

## Inventory truth

| Piece | Public state |
|---|---|
| Heresy Journal | AVAILABLE — one finished piece, $75 shipped domestic |
| Everyday Carry Pouch | MADE TO ORDER — from $85 |
| Banzai Journal | SOLD |
| Turtles Journal | SOLD |
| Green Mushroom Journal | SOLD |

## Public-surface verification

`npm run verify:v2` result:

- State: `VERIFIED_COMPLETE`
- Generated pages checked: 12
- Public files: 125
- Public build bytes: 23,635,709, including the complete lazy-loaded responsive image set
- Internal link failures: 0
- Forbidden public paths: 0
- Navigation items: exactly 5

Live Sites probes returned 404 for:

- `/vault/`
- `/scripts/`
- `/docs/`
- `/content/`
- `/package.json`
- `/.env`
- `/Cults3D/`

The GitHub Pages workflow now builds and verifies V2, then uploads only `dist/client` instead of the repository root.

## Performance and accessibility

Local Lighthouse against the final build:

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT | Initial transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mobile | 99 | 100 | 100 | 100 | 1.2 s | 2.1 s | 0 | 0 ms | 826 KiB |
| Desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 | 0 ms | 1,121 KiB |

Current-site baseline from Phase 0 was roughly 35 MB and a 47.9-second mobile LCP. The V2 mobile initial transfer is about 97.7% smaller, and measured LCP is about 95.6% faster in this controlled comparison.

## Visual and interaction proof

Rendered at 1440×1000 desktop and iPhone 15 / 393×659 mobile.

- Eight desktop routes inspected at full-page and overview scale.
- Core mobile routes inspected at full-page and overview scale.
- Live deployed homepage inspected on desktop and mobile.
- Horizontal overflow: none.
- Broken images: 0.
- Live browser console errors/warnings: 0/0.
- Mobile menu: opens, reports expanded state, and closes with Escape.
- Product lightbox: opens at full detail and closes with Escape.
- Legacy `/standard-pieces/` route: redirects to `/shop/`.
- Social preview: exact 1200×630 card, 140,092 bytes, generated once and visually inspected before integration.

Primary proof files:

- `output/playwright/horizon-v2-2026-08-29/desktop-route-overview.jpg`
- `output/playwright/horizon-v2-2026-08-29/mobile-route-overview.jpg`
- `output/playwright/horizon-v2-2026-08-29/desktop-home-viewport.png`
- `output/playwright/horizon-v2-2026-08-29/mobile-home-viewport.png`
- `output/playwright/horizon-v2-2026-08-29/desktop-lightbox-open.png`
- `output/playwright/horizon-v2-2026-08-29/mobile-nav-open.png`
- `output/playwright/horizon-v2-2026-08-29/live-desktop-home-full.png`
- `output/playwright/horizon-v2-2026-08-29/live-mobile-home-full.png`

## Source, package, and deployment readback

- Work branch: `codex/horizon-v2-rebuild`
- Main V2 implementation commit: `ce947da9713f58de3c1bf40b7c6a8344be50b05d`
- V2 code head before the receipt-only commit: `c44e9810b90c3ba7d89e6b009739949da72cbd14`
- Minimal Sites source commit: `15bb890cb1262c7a4705179a640b6645cefaa3cc`
- Sites source branch SHA readback: MATCH
- Sites archive: `artifacts/horizon-v2/horizon-v2-sites.tgz`
- Local archive SHA-256: `89C40408BB25497F262D21B2B97409B2B00AA6C1E87EE534B64D214C8E6D7028`
- Archive contains `dist/server/index.js` and `dist/.openai/hosting.json`: YES
- Saved Sites version: 21
- Saved version source SHA: MATCH
- Deployment ID: `appgdep_6a93c9887ba48191a1acf5819af1d263`
- Deployment terminal state: `succeeded`
- Verified production URL: <https://horizon-creations.the-vaultkeeper.chatgpt.site>

The pre-existing dirty legacy worktree was preserved. No reset, clean, stash, broad formatting, or unrelated commit was performed.

## Owner-domain state and exact blocker

Attached Sites hostnames:

- `horizoncreations.art` — pending
- `www.horizoncreations.art` — pending

Current authoritative DNS readback still points to GitHub Pages:

- Apex A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `www` CNAME: `vaultkeeper-forge.github.io`
- Nameservers: `chuck.ns.cloudflare.com`, `sue.ns.cloudflare.com`

Required Cloudflare cutover records returned by Sites:

1. TXT `_openai-site-verification.horizoncreations.art` = `openai-site-verification=gwlzVoP7Yydv6pSjrZDAeRtVZsDF7NobamFztxhU6g4`
2. TXT `_cf-custom-hostname.horizoncreations.art` = `c7d3095e-b0e1-479d-aa23-209f7d81b9d1`
3. Apex A = `162.159.143.30`
4. Apex A = `172.66.3.26`
5. TXT `_openai-site-verification.www.horizoncreations.art` = `openai-site-verification=eylhIdqZppTs7c4GvYIuA4xWZZDE3Cd5cFKL4DSJHx0`
6. TXT `_cf-custom-hostname.www.horizoncreations.art` = `55dae45a-3fa2-4f06-8a59-bc136ff8620a`
7. `www` CNAME = `custom-domains.chatgpt.site.`

Comet readback reached the Cloudflare sign-in page. Rivet did not enter credentials, alter DNS, or remove the live GitHub records. Owner sign-in is the remaining gate; after sign-in, apply only the exact records above, verify both Sites hostnames become `active`, verify HTTPS on apex and `www`, and retain the old deployment as rollback evidence until that readback passes.
