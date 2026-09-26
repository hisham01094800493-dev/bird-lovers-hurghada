import type { Express } from "express";
import { ENV } from "./env";
import { getLocalStoragePath, storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
        if (!ENV.s3Endpoint || !ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
          if (process.env.VERCEL) {
            res.status(503).send("Persistent object storage is not configured");
            return;
          }
          res.sendFile(getLocalStoragePath(key), err => { if (err && !res.headersSent) res.status((err as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500).send("Image not found"); });
          return;
        }
        const url = await storageGetSignedUrl(key);
        res.set("Cache-Control", "private, max-age=300");
        res.redirect(307, url);
        return;
      }
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
