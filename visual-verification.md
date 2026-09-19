# Visual verification

- Desktop preview checked: `/`, `/marketplace`, `/messages`, `/notifications`, `/admin` at 1280x720.
- Mobile preview checked: `/` and `/sell` at 390x844.
- The public shell keeps the bilingual navigation, strong serif display hierarchy, coral/green palette, and responsive mobile header.
- Marketplace listing cards render with seeded imagery and the admin dashboard shows live KPI cards and protected moderation UI.
- Messaging and notification empty states render clearly when unauthenticated or without records.
- The multi-image seller form remains readable on mobile and preserves the existing card/step visual language.
- Screenshot tool intentionally hides fixed lower chrome; no layout issue was observed in the captured viewport.

## Second pass

The seller profile and seller studio routes render through the same bilingual shell, and the admin route renders the moderation header, KPI cards, report area, and community-safety section. Protected profile/studio routes can show a brief authentication/data loading state in a cold preview, while the admin shell remains visible with zero-state cards when no records are available in that session. The layout remains responsive and preserves the existing visual system.
