# Social Intake

This folder is backend-only. Nothing here is rendered on the live frontend.

Use it to stage Facebook and Instagram media before anything is copied into site content folders.

## Purpose

- keep social discovery separate from live site content
- review photos and captions before they get reused
- preserve approval-first workflow
- keep original downloaded copies outside the live gallery folders until a human signs off

## Layout

- `content/social-intake/source-profiles/`
  source definitions for the Horizon Creations Facebook and Instagram profiles
- `content/social-intake/candidates/`
  generated candidate manifests from the Meta API

## Workflow

1. Add Meta credentials to `.env.local`
2. Validate config:

```powershell
npm run meta:validate
```

3. Preview discovery without writing files:

```powershell
npm run meta:discover:dry-run
```

4. Fetch and write candidate manifests:

```powershell
npm run meta:discover
```

5. Open the manifest files and mark items:
   - `workflow.reviewed`
   - `workflow.approvedForDownload`
   - `workflow.approvedForSiteUse`
   - `workflow.targetSection`
   - `workflow.targetSlugHint`
   - `workflow.notes`

6. Preview download plan:

```powershell
npm run meta:download:dry-run
```

7. Download approved originals to `tmp/meta-imports/`:

```powershell
npm run meta:download
```

8. Build a site-import plan:

```powershell
npm run meta:site-plan
```

## Notes

- nothing downloads unless `approvedForDownload` is `true`
- nothing becomes a site entry automatically
- use the downloaded copies as the working source when adding photos to `content/standard-pieces/`, `content/custom-pieces/`, or `content/workbench/`
