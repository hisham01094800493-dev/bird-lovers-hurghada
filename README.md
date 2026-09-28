# Bird Lovers in Hurghada

A bilingual Arabic/English marketplace and community foundation for buying, selling, and exchanging birds, pets, cages, food, and supplies in Hurghada.

> تم إيقاف AdSense لأن Vercel Hobby غير تجارية؛ يُعاد عند الترقية إلى Pro أو النقل.

## MVP delivered

The first production-oriented slice includes a real React + tRPC + Express + Drizzle + MySQL/TiDB application with Manus OAuth already wired. It includes a public landing page, marketplace browsing, search, category filtering, listing detail pages, saved listings, authenticated listing submission, community posts, responsive mobile-first UI, accessible empty/loading states, seeded content, and a safe link back to the original Facebook group.

The current MVP routes are:

| Route | Purpose |
| --- | --- |
| `/` | Landing page and latest listings |
| `/marketplace` | Searchable marketplace with category filters and pagination |
| `/listing/:id` | Listing detail, share, save, seller context |
| `/sell` | Authenticated listing submission into a moderation queue |
| `/community` | Community feed and authenticated post creation |
| `/favorites` | Authenticated saved listings |

## Architecture decisions

The WebDev full-stack scaffold uses **Drizzle ORM with MySQL/TiDB** rather than PostgreSQL because that is the managed database provided by this runtime. The schema is normalized and keeps location as data, not hard-coded domain logic. Listings are created as `pending_review` and only public listings with `approved` moderation status are shown in browse queries. Favorites have a database-level unique constraint to prevent duplicates. Images are stored as S3-compatible storage paths, never as database blobs.

The Facebook group remains an external community bridge at `https://www.facebook.com/groups/798363001904219/?ref=share_group_link`. The MVP intentionally does not scrape or mirror live group images/posts: private-group permissions, Facebook platform policies, and source volatility make that unsafe and unreliable. The application uses curated seed assets and a clear outbound group link instead.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

The project relies on the managed environment variables already provided by WebDev, including `DATABASE_URL`, Manus OAuth variables, and storage credentials. Do not commit secrets or `.env` files.

## Vercel deployment

Production deploys automatically from the GitHub `main` branch to Vercel. Database migrations are applied explicitly with `pnpm exec drizzle-kit migrate`; the application does not mutate the schema or seed data during startup.

Configure the following variables in the Vercel project before the first deployment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string used by Drizzle and the migration command |
| `DB_CA_CERT` | Recommended | CA certificate for verified TLS to the managed MySQL provider |
| `CRON_SECRET` | Yes | Secret header for scheduled cleanup endpoints |
| `JWT_SECRET` | Yes | Secret used to sign login session cookies; use a long random value |
| `VITE_APP_ID` | Yes | Application identifier used by the OAuth client and frontend |
| `OAUTH_SERVER_URL` | Yes | OAuth server base URL |
| `OWNER_OPEN_ID` | Recommended | Open ID used only for the initial owner account |
| `BUILT_IN_FORGE_API_URL` | Feature-dependent | Server-side storage, maps, media, and data API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Feature-dependent | Server-side credential for the Forge endpoint |
| `VITE_OAUTH_PORTAL_URL` | Yes for login | Public OAuth portal URL embedded in the client build |
| `VITE_FRONTEND_FORGE_API_URL` | Feature-dependent | Browser-facing maps/API endpoint embedded in the client build |
| `VITE_FRONTEND_FORGE_API_KEY` | Feature-dependent | Browser-facing maps/API key embedded in the client build |
| `VITE_CONTACT_EMAIL` | Recommended | Public inbox used by the contact page; do not hardcode a personal address |

Variables beginning with `VITE_` are embedded into the client bundle at build time, so set them before deploying or redeploy after changing them. Do not expose server-only secrets such as `JWT_SECRET`, `DATABASE_URL`, or `BUILT_IN_FORGE_API_KEY` as `VITE_` variables. After deployment, set the OAuth callback URL to `<Vercel public URL>/api/oauth/callback` in the OAuth provider. Check `<Vercel public URL>/health` before testing login, listings, uploads, and map features.

## Database

Schema source: `drizzle/schema.ts`

Migration: `drizzle/0001_natural_chronomancer.sql`

Seed script:

```bash
pnpm exec tsx server/seed.ts
```

The seed script is repeatable and adds two demo sellers, six categories, four approved listings with storage-backed cover images, and two community posts. It does not overwrite existing listings or posts.

## Next implementation phases

1. **Phase 2 — Trust and communication:** in-app conversations, report flows, seller profiles, reviews, moderation queue, notifications, and server-side authorization tests for each workflow.
2. **Phase 3 — Media and discovery:** direct multi-image uploads, compression and thumbnails, breed/attribute management, advanced filters, SEO metadata, sitemap, PWA manifest, and offline fallback.
3. **Phase 4 — Operations:** admin dashboard, audit logs, analytics, backup/restore procedure, rate limiting, abuse detection, and staging/production runbooks.

Buttons for features that are not yet implemented are either absent or explicitly marked with a coming-soon toast; the MVP does not claim that messaging is complete.

## Deployment

Production deploys automatically from the GitHub `main` branch to Vercel.
