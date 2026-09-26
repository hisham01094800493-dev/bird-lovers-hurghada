# Bird Lovers in Hurghada

A bilingual Arabic/English marketplace and community foundation for buying, selling, and exchanging birds, pets, cages, food, and supplies in Hurghada.

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

## Railway deployment

The repository includes `railway.json` for a single Railway web service. Railway uses Railpack to install the pinned pnpm dependencies and run `pnpm build`, executes the committed Drizzle migrations before each deployment, starts the server with `pnpm start`, and checks `/health` before routing traffic. The server listens on Railway's injected `PORT` and binds to `0.0.0.0`.

Create a Railway MySQL-compatible database and connect it to the application service so that `DATABASE_URL` is available. Configure the following variables in the Railway service before the first deployment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string used by Drizzle and the migration command |
| `JWT_SECRET` | Yes | Secret used to sign login session cookies; use a long random value |
| `VITE_APP_ID` | Yes | Application identifier used by the OAuth client and frontend |
| `OAUTH_SERVER_URL` | Yes | OAuth server base URL |
| `OWNER_OPEN_ID` | Recommended | Open ID that receives owner/admin behavior |
| `BUILT_IN_FORGE_API_URL` | Feature-dependent | Server-side storage, maps, media, and data API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Feature-dependent | Server-side credential for the Forge endpoint |
| `VITE_OAUTH_PORTAL_URL` | Yes for login | Public OAuth portal URL embedded in the client build |
| `VITE_FRONTEND_FORGE_API_URL` | Feature-dependent | Browser-facing maps/API endpoint embedded in the client build |
| `VITE_FRONTEND_FORGE_API_KEY` | Feature-dependent | Browser-facing maps/API key embedded in the client build |

Variables beginning with `VITE_` are embedded into the client bundle at build time, so set them before deploying or redeploy after changing them. Do not expose server-only secrets such as `JWT_SECRET`, `DATABASE_URL`, or `BUILT_IN_FORGE_API_KEY` as `VITE_` variables. After deployment, set the OAuth callback URL to `<Railway public URL>/api/oauth/callback` in the OAuth provider. The first deployment should be checked at `<Railway public URL>/health` before testing login, listings, uploads, and map features.

Railway's pre-deploy migration command is intentionally limited to applying committed migrations. It does not generate schema changes in production; create and review new migrations locally, commit them, and deploy them through version control.

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


## Vercel + Aiven deployment

The repository includes an Express entry point at `server.ts` for Vercel Functions, a Vercel build command, and a build helper that copies Vite's generated client assets into `public/`. The root directory is the repository root. The project supports Node.js 22–24; the linked Vercel project currently uses 24.x. Use Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm build:vercel`, and leave Output Directory unset because Vercel serves `public/` as static assets while routing the exported Express app as a Function. Do not deploy this repository as a Vite-only static site: that would omit its API and database-backed features.

### Environment variables

Set the production environment variables in the Vercel project dashboard. Never commit their values or paste them into a public issue. Required runtime settings are `DATABASE_URL`, `AIVEN_CA_CERT`, and `JWT_SECRET`. `VITE_APP_ID`, `OAUTH_SERVER_URL`, and optionally `VITE_OAUTH_PORTAL_URL` are required only if enabling the existing Manus OAuth sign-in route. Configure `OWNER_OPEN_ID` if the admin-owner role depends on it. Use separate long, random values for `JWT_SECRET`, `CRON_SECRET`, and `PRICE_REFRESH_SECRET`.

For Aiven, copy the MySQL connection details from **Service Overview → Quick connect** and use the database created for the application (Aiven's `defaultdb` is a valid initial choice). Set `DATABASE_URL` to the Aiven `mysql://` connection URI; percent-encode special characters in its username/password. Download the service/project CA certificate and put its full PEM contents in `AIVEN_CA_CERT`. The runtime and Drizzle Kit migration configuration require verified TLS and verify the server identity for Aiven hosts. Do not set `rejectUnauthorized` to `false`.

The application uses S3-compatible object storage for durable listing, avatar, and post images. On Vercel, set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`; set `S3_PUBLIC_URL` if the storage provider has a public CDN URL. Without these settings, Vercel intentionally rejects uploads instead of saving files on its temporary filesystem. `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` can be used only if that service is actually available to the external deployment. `VITE_FRONTEND_FORGE_API_URL` and `VITE_FRONTEND_FORGE_API_KEY` are public browser-bundle variables and must never contain server-only credentials.

### Prepare the Aiven schema

Provision the Aiven MySQL service, configure `DATABASE_URL` and `AIVEN_CA_CERT` in a trusted local environment (or a protected CI environment), and run `pnpm db:migrate` once to apply the committed Drizzle migrations. Then add the production secrets to Vercel and deploy. The project does not export or import live Railway database records automatically; take a separate database backup/restore before switching traffic if existing user data must be retained.

### Vercel background tasks and payload limits

`vercel.json` schedules the expired-message-attachment cleanup endpoint once daily at 04:00 UTC. Set `CRON_SECRET` in Vercel; Vercel sends it as a Bearer token to protect the job. The existing weekly price-draft GitHub Actions workflow calls the Railway URL by default for backward compatibility; to move it, set the GitHub Actions variable `APP_BASE_URL` to the production Vercel URL and set repository secret `PRICE_REFRESH_SECRET` to the same value configured in Vercel.

Vercel Functions are request-scoped and have a request-body size ceiling. The app uses base64 image/audio payloads, so large uploads and multi-image listings may exceed Vercel's body limit even though the original app allowed larger bodies. This release limits Express JSON parsing to 4 MB on Vercel, but fully retaining large/multiple uploads requires a later direct-to-object-storage upload flow. Test the site's listing, chat, and profile upload paths after deployment.

### Authentication and URL registration

The code retains its existing Manus OAuth integration; Vercel does not inherit credentials or app configuration from the former managed host. Supply valid OAuth application settings and register the callback as `https://<your-vercel-domain>/api/oauth/callback` with the OAuth provider. The local email/password workflow is also part of the app, but verify sign-up, sign-in, secure cookies, and admin ownership against the production database before sending users to the new URL.

The Aiven Free MySQL plan is small (1 GB RAM and 1 GB storage) and has no 99.99% availability SLA; plan backups and monitor storage/connection use. Vercel Hobby is limited to non-commercial personal use, so confirm that the selected Vercel plan permits the site's intended use.


Set `VITE_SITE_URL` in the Vercel Production environment to the exact public HTTPS URL assigned to the project (for example, `https://bird-lovers-hurghada.vercel.app`) before building. This value replaces the prior Railway URL in the canonical, Open Graph, and social image metadata. If Vercel assigns a different domain, use that exact production domain. The Umami script variables `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are optional; set both if analytics should be enabled.

Official references: [Vercel Express deployment](https://vercel.com/docs/frameworks/backend/express), [Vercel Cron jobs](https://vercel.com/docs/cron-jobs), [Aiven MySQL free tier](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), and [Vercel Terms of Service](https://vercel.com/legal/terms#4-hobby-plan).
