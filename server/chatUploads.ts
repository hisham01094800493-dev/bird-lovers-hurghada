import sharp from "sharp";

export const CHAT_MAX_BYTES = 8_000_000;
export const CHAT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CHAT_AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"] as const;

export async function validateChatUpload(input: { buffer: Buffer; contentType: string; kind: "image" | "audio" }) {
  if (input.buffer.byteLength === 0 || input.buffer.byteLength > CHAT_MAX_BYTES) throw new Error("Attachment must be between 1 byte and 8MB");
  if (input.kind === "image") {
    if (!CHAT_IMAGE_TYPES.includes(input.contentType as (typeof CHAT_IMAGE_TYPES)[number])) throw new Error("Only JPEG, PNG, and WebP images are supported");
    const image = sharp(input.buffer, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width < 160 || metadata.height < 160) throw new Error("Image must be at least 160×160 pixels");
    return { buffer: await image.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(), contentType: "image/webp" };
  }
  if (!(CHAT_AUDIO_TYPES as readonly string[]).includes(input.contentType)) throw new Error("Unsupported audio format");
  return { buffer: input.buffer, contentType: input.contentType };
}
