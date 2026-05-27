# Meta Social Import Architecture

This project keeps Horizon Creations as the main branded site.

Facebook and Instagram are being prepared as media-source systems, not as the frontend itself.

## What this adds

- environment-variable-only Meta config
- backend scripts for media discovery
- candidate manifests with approval flags
- download planning for approved originals
- site-import planning without auto-publishing

## Why it is separate from live content

Social posts are not the same as site-ready gallery entries.

Keeping them separate makes it possible to:

- review what is worth reusing
- keep captions and source links attached
- preserve original downloaded copies
- choose whether something belongs in:
  - `standard-pieces`
  - `custom-pieces`
  - `workbench`

## Environment variables

Put these in shell vars or a local ignored `.env.local` file.

- `META_ACCESS_TOKEN`
- `META_GRAPH_API_VERSION`
- `META_FACEBOOK_PAGE_ID`
- `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `META_IMPORT_LIMIT`

## Commands

Validate Meta config:

```powershell
npm run meta:validate
```

Preview discovery:

```powershell
npm run meta:discover:dry-run
```

Fetch candidate manifests:

```powershell
npm run meta:discover
```

Preview approved download plan:

```powershell
npm run meta:download:dry-run
```

Download approved originals:

```powershell
npm run meta:download
```

Build the site-import plan:

```powershell
npm run meta:site-plan
```

## Approval-first workflow

Nothing goes live automatically.

Each discovered media item carries workflow flags:

- `reviewed`
- `approvedForDownload`
- `approvedForSiteUse`
- `targetSection`
- `targetSlugHint`
- `notes`

The intended flow is:

1. Discover media from Meta
2. Review candidate manifest items
3. Approve the originals you want downloaded
4. Download originals to `tmp/meta-imports/`
5. Approve which ones belong on the site
6. Build a site-import plan
7. Have Codex place selected files into live content folders

## Source data shape

The manifest format keeps:

- source platform
- source media ID
- caption text
- permalink
- timestamp
- media type
- direct media URL or child URLs
- workflow approvals

## Current limitation

The right-way path needs a real Meta token and account IDs.

Without those, the dry-run commands still show the workflow, but real discovery cannot pull media yet.

## Official docs used

- Meta Graph API
- Facebook Page photos endpoint
- Instagram Graph API media discovery
- Instagram oEmbed for individual public posts when needed later
