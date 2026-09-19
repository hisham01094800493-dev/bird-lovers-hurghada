# Three-stage continuation plan

This branch starts from the latest product-updates commit and prepares the next connected workstream:

1. **Listing gallery** — `ListingGallery` supports multiple images, thumbnails, keyboard/mobile-friendly navigation, and a fullscreen lightbox. The listing API should expose all `listingImages` ordered by `sortOrder` and the details page should render this component.
2. **Clearer messaging UI** — `ChatComposer` provides an explicit composer state, attachment preview/removal, disabled controls while sending, and recording status.
3. **Validated media chat** — `validateChatUpload` enforces type, byte-size, and image-dimension limits before storage. The production wiring should add an authenticated mutation that checks conversation membership, uploads through `storagePut`, stores `attachmentPath`, and sends a notification only to the other participant.

The existing database already has `listingImages` and `messages.attachmentPath`; no destructive schema change is required for the first implementation. Keep media uploads behind the authenticated conversation-membership check and reject empty messages without an attachment.
