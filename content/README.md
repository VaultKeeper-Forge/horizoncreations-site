# Content Workflow

This site is generated from the folders inside:

- `content/standard-pieces/`
- `content/custom-pieces/`
- `content/workbench/`

Separate backend-only product staging for future Shopify work lives in:

- `content/product-staging/`

Separate backend-only social intake for future Facebook / Instagram imports lives in:

- `content/social-intake/`

Local hand-picked phone drops that still need sorting can live in:

- `New Photos Move Assests As Needed/`

## Add a New Entry

1. Create a new folder inside the correct section with a simple slug name.
2. Drop the entry photos into that folder.
3. Add an `entry.json` file beside the photos.
4. Run `npm run build`.

## Minimal `entry.json`

```json
{
  "title": "Example Entry",
  "caption": "Short line that shows up on the gallery card.",
  "description": "Optional longer paragraph with more context.",
  "tags": ["leather", "custom"],
  "date": "2026-04-20",
  "featured": false,
  "featuredImage": "hero.jpg"
}
```

## Notes

- `title` and `caption` are required.
- `description`, `tags`, `date`, `featured`, `featuredImage`, and `sortOrder` are optional.
- If `featuredImage` is omitted, the first image file in the folder becomes the hero image.
- Every image file in the folder is automatically included on the gallery card.
- `featured: true` lets an entry surface on the homepage.
- `content/product-staging/` is not rendered on the live site. It exists for backend prep, sellable-item validation, and future Shopify export workflows.
- `content/social-intake/` is not rendered on the live site. It exists for Meta photo discovery, approval flags, and future site-import planning.
- `New Photos Move Assests As Needed/` is a local intake folder outside the live build. Use clear names like `OnBench`, `WIP`, and cleaner hero-style names so sorting into live content is fast.
