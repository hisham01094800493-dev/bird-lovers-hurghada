// Storage helpers with a Forge-first strategy and a Railway Volume fallback.
// Forge remains the preferred durable object store when its env vars exist.
// When Forge is unavailable, files are written to LOCAL_STORAGE_DIR (or /data/uploads
// in production) and served through /manus-storage/{key}.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) return null;
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

export function getLocalStorageDir(): string {
  return process.env.LOCAL_STORAGE_DIR?.trim() || (ENV.isProduction ? "/data/uploads" : path.resolve(process.cwd(), ".data/uploads"));
}

export function normalizeKey(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  if (!key || key.includes("\\") || key.split("/").some((segment) => segment === "..")) {
    throw new Error("Invalid storage key");
  }
  return key;
}

export function getLocalStoragePath(relKey: string): string {
  const key = normalizeKey(relKey);
  const root = path.resolve(getLocalStorageDir());
  const filePath = path.resolve(root, key);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }
  return filePath;
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function hasForgeStorage(): boolean {
  return Boolean(getForgeConfig());
}

export function getStorageBackend(): "forge" | "local" {
  return hasForgeStorage() ? "forge" : "local";
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const forge = getForgeConfig();

  if (!forge) {
    const filePath = getLocalStoragePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, typeof data === "string" ? Buffer.from(data) : Buffer.from(data));
    console.warn(`[Storage] Forge unavailable; saved ${key} to ${getLocalStorageDir()} (${contentType})`);
    return { key, url: `/manus-storage/${key}` };
  }

  const presignUrl = new URL("v1/storage/presign/put", forge.forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forge.forgeKey}` },
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data as any], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!uploadResp.ok) throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  const forge = getForgeConfig();
  if (!forge) return `/manus-storage/${key}`;

  const getUrl = new URL("v1/storage/presign/get", forge.forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forge.forgeKey}` },
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = (await resp.json()) as { url: string };
  return url;
}
