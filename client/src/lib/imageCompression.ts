export type CompressedImage = { dataUrl: string; contentType: "image/webp" | "image/jpeg" };

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(blob);
  });
}

export async function compressImage(
  file: File,
  options: { maxDimension?: number; maxBytes?: number } = {},
): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new Error("type");
  if (file.size > 12_000_000) throw new Error("size");
  const source = await readAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("image"));
    element.src = source;
  });
  const maxDimension = options.maxDimension ?? 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const maxBytes = options.maxBytes ?? 600_000;
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= maxBytes) return { dataUrl: await readAsDataUrl(blob), contentType: "image/webp" };
    if (blob && quality === 0.52) return { dataUrl: await readAsDataUrl(blob), contentType: "image/webp" };
  }
  const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.72));
  if (!jpeg) throw new Error("encode");
  return { dataUrl: await readAsDataUrl(jpeg), contentType: "image/jpeg" };
}
