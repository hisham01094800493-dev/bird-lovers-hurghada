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

## Custom notifications pass

The notifications page now presents a two-column inbox and preferences layout with clear empty-state handling. The admin dashboard renders the protected custom-notification composer directly beneath the KPI cards, with a calm green surface that matches the existing visual system. Desktop screenshots confirmed the controls are readable and aligned; member preferences remain separated from admin broadcast controls.

## Stability and listing-form pass

Full-page screenshots show `/sell`, `/marketplace`, and `/notifications` rendering without the blank error screen. The listing form now clearly separates `الفئة / Category` from `السعر بالجنيه المصري / Price in EGP`, uses a dedicated EGP suffix, bilingual labels, Arabic direction for Arabic fields, and visible image constraints. The notification preferences panel remains intact after the stability changes.

## Language switch pass

Browser verification confirmed the header toggle changes the full page to Arabic, updates navigation and marketplace content, sets `document.documentElement.lang` to `ar`, sets `dir` to `rtl`, and stores `bird-lovers-language=ar` in localStorage. The toggle label changes to `English`, allowing the user to switch back.

## Category selector stability pass

The mobile `/sell` screenshot now shows one stable Radix Select trigger with the bilingual placeholder `اختر الفئة / Choose category`; loading and error states are rendered outside the option list, and the field is disabled until category data is ready. TypeScript, all 10 tests, and the production build pass.
