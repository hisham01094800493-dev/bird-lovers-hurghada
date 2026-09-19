# Bird Lovers MVP enhancement tracker

## Completed

All requested enhancement gaps are now implemented and verified:

- [x] Administrator role for `h201065303382@gmail.com`, enforced in the server middleware.
- [x] Admin KPI dashboard, listing approval/rejection queue, report resolution, and community-post hide/lock/restore screen with audit logs.
- [x] Conversations, messages, notifications, reports, reviews, and audit-log tables and protected tRPC procedures.
- [x] Up to six image uploads per listing with MIME/size validation, minimum 320×320 dimensions, EXIF-safe rotation, resizing, and WebP normalization via Sharp.
- [x] Seller profile editing, manual phone verification requests, explicit WhatsApp opt-in, and verified-contact gating before public WhatsApp links.
- [x] Seller studio with full left/right image reordering persistence; the first image becomes the cover.
- [x] Review eligibility restricted to completed sold/exchanged listings with an associated conversation.
- [x] PWA manifest, icons, service-worker shell caching, install-availability/install-complete telemetry, and black full-image startup screen using the uploaded artwork.
- [x] Protected messages with five-second near-real-time refresh, plus responsive messages, notifications, profile, seller studio, and admin routes.
- [x] `pnpm check`, `pnpm test`, `pnpm build`, database migrations, and desktop/mobile visual verification completed.
