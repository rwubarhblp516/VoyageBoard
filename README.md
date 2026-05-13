# VoyageBoard

VoyageBoard is a Vite + React app backed by Supabase. Production is deployed by Cloudflare Pages from GitHub.

## Stack

- React 19
- Vite 6
- TypeScript
- Supabase
- Cloudflare Pages

## Local Development

Install dependencies:

```bash
npm ci
```

Run the dev server:

```bash
npm run dev
```

Build locally:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Environment Variables

Create a local `.env` file with:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Important:

- `.env` is intentionally ignored and must not be committed.
- `VITE_*` values are bundled into the frontend build. Do not put private service-role keys there.
- Cloudflare Pages project `trip` also needs these variables configured in its dashboard environment variables.

## Supabase

Remote project ref:

```text
ochnzkzadpkhjyeokbkd
```

Migrations live in:

```text
supabase/migrations
```

Check migration status:

```bash
npx supabase migration list
```

Apply pending migrations to the linked remote project:

```bash
npx supabase db push
```

If the project is not linked:

```bash
npx supabase link --project-ref ochnzkzadpkhjyeokbkd
```

Notes:

- The migration `20260512020000_share_personal_checklists.sql` was applied to the remote database on 2026-05-12.
- The migration `20260512043000_nested_checklist_groups.sql` adds collapsible checklist groups through `item_kind` and `parent_id`.
- The migration `20260513043000_trip_timeline.sql` adds trip days, timeline entries, and travel segments for itinerary recording.
- The migration `20260513062000_refine_timeline_permissions.sql` adds guide inclusion flags and limits itinerary deletion to the author or trip owner.
- The migration `20260513070000_timeline_entry_images.sql` adds compressed WebP image attachments for timeline entries through the `trip-images` storage bucket.
- The migration `20260513076000_checklist_member_confirmations.sql` adds per-member checklist confirmations so every member can see who confirmed each item.
- Keep database changes in timestamped SQL files under `supabase/migrations`.

## Cloudflare Pages Deployment

Current production Cloudflare Pages project:

```text
trip
```

Production custom domain:

```text
trip.hpptools.top
```

Cloudflare Pages Git integration settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Deploy command: leave blank
Production branch: main
```

The `trip` Pages project is the GitHub-connected production project. Pushes to `main` should trigger automatic Cloudflare Pages deployments.

Do not use the old Direct Upload Pages project `voyageboard` for new production deployment. It was a Wrangler/Direct Upload project and cannot be converted to Git integration.

Manual deployment is still possible if needed:

```bash
npm run build
source ~/.bashrc && npx --yes wrangler pages deploy dist --project-name trip --branch main
```

Use manual deployment only for emergency or one-off cases. Normal deployment should be through GitHub pushes.

Check Cloudflare Pages deployments:

```bash
source ~/.bashrc && npx --yes wrangler pages deployment list --project-name trip
```

## Git Hygiene

Ignored files include:

- `node_modules`
- `dist`
- `.env`
- `.env.local`
- `.env.*.local`

`dist` is build output and should not be committed. Cloudflare builds it from source.

Before pushing:

```bash
npm run build
git status --short
```

## Routing

The SPA fallback lives in:

```text
public/_redirects
```

Current rule:

```text
/* /index.html 200
```

This is for Cloudflare Pages. If a deployment error references `/workers/scripts/...`, the project is being deployed as a Worker instead of a Pages project.
