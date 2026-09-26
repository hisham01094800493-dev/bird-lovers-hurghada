import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  if (!key || key.includes("\\") || key.split("/").some(segment => segment === "..")) throw new Error("Invalid storage key");
  return key;
}

export function getLocalStorageDir() { return process.env.LOCAL_STORAGE_DIR?.trim() || (ENV.isProduction ? "/data/uploads" : path.resolve(process.cwd(), ".data/uploads")); }
export function getLocalStoragePath(relKey: string) {
  const key = normalizeKey(relKey);
  const root = path.resolve(getLocalStorageDir());
  const filePath = path.resolve(root, key);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage key");
  return filePath;
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function hasForgeStorage() { return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey); }
function hasS3Storage() {
  return Boolean(ENV.s3Bucket && ENV.s3AccessKeyId && ENV.s3SecretAccessKey && ENV.s3Endpoint);
}
export function hasRemoteStorage() { return hasForgeStorage() || hasS3Storage(); }
function getS3Client() {
  if (!hasS3Storage()) return null;
  return new S3Client({ region: ENV.s3Region || "auto", endpoint: ENV.s3Endpoint, forcePathStyle: ENV.s3ForcePathStyle, credentials: { accessKeyId: ENV.s3AccessKeyId, secretAccessKey: ENV.s3SecretAccessKey } });
}
function storageConfigError() {
  return new Error("Persistent storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and optionally S3_PUBLIC_URL.");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  if (hasForgeStorage()) {
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
    presignUrl.searchParams.set("path", key);
    const presignResp = await fetch(presignUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
    if (!presignResp.ok) throw new Error(`Storage presign failed (${presignResp.status})`);
    const { url: s3Url } = (await presignResp.json()) as { url: string };
    if (!s3Url) throw new Error("Forge returned empty presign URL");
    const uploadResp = await fetch(s3Url, { method: "PUT", headers: { "Content-Type": contentType }, body: new Blob([data as any], { type: contentType }) });
    if (!uploadResp.ok) throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
    return { key, url: `/manus-storage/${key}` };
  }
  const client = getS3Client();
  if (client && ENV.s3Bucket) {
    await client.send(new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: key, Body: data, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    return { key, url: ENV.s3PublicUrl ? `${ENV.s3PublicUrl.replace(/\/+$/, "")}/${key}` : `/manus-storage/${key}` };
  }
  if (process.env.VERCEL) throw storageConfigError();
  const filePath = getLocalStoragePath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, typeof data === "string" ? Buffer.from(data) : Buffer.from(data));
  console.warn(`[Storage] Saved ${key} to ${getLocalStorageDir()} (${contentType})`);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: ENV.s3PublicUrl ? `${ENV.s3PublicUrl.replace(/\/+$/, "")}/${key}` : `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (hasForgeStorage()) {
    const getUrl = new URL("v1/storage/presign/get", `${ENV.forgeApiUrl.replace(/\/+$/, "")}/`);
    getUrl.searchParams.set("path", key);
    const resp = await fetch(getUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
    if (!resp.ok) throw new Error(`Storage signed URL failed (${resp.status})`);
    const { url } = (await resp.json()) as { url: string };
    if (!url) throw new Error("Empty signed URL from backend");
    return url;
  }
  const client = getS3Client();
  if (client && ENV.s3Bucket) return getSignedUrl(client, new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: 3600 });
  return `/manus-storage/${key}`;
}
