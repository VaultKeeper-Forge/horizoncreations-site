# Product Staging

This folder is backend-only. Nothing here is rendered on the live frontend.

Use it to stage items for future Shopify work without mixing store data into the gallery content.

## Content kinds

- `gallery-only`: useful for site/gallery organization, but never meant for sale
- `custom-not-for-sale`: custom jobs, one-offs, or commissions that should never become a store item
- `sellable-product`: something that can be validated, reviewed, and later exported to Shopify as a draft

## Workflow

1. Add or update a staged product folder
2. Put a `product.json` file inside
3. Point image entries at local site content paths or future remote image URLs
4. Run validation:

```powershell
npm run shopify:validate
```

5. Preview the Shopify payload:

```powershell
npm run shopify:preview
```

6. Do a safe dry-run export:

```powershell
npm run shopify:export:dry-run
```

7. Only after review and approval, run a real export:

```powershell
npm run shopify:export
```

## Notes

- `approvedForExport` must stay `false` until a human signs off
- `sellable-product` items can still be held back with `publish: false`
- local relative content paths like `/content/...` are valid staging references even if media upload handling is finished later
