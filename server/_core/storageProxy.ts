import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { Express } from "express";
import { getLocalStoragePath, getStorageBackend, normalizeKey } from "../storage";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const rawKey = (req.params as Record<string, string>)[0];
    if (!rawKey) {
      res.status(400).send("Missing storage key");
      return;
    }

    let key: string;
    try {
      key = normalizeKey(rawKey);
    } catch {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (getStorageBackend() === "local") {
      try {
        const filePath = getLocalStoragePath(key);
        const info = await stat(filePath);
        if (!info.isFile()) {
          res.status(404).send("Storage file not found");
          return;
        }
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.type(filePath);
        createReadStream(filePath).pipe(res);
      } catch (err) {
        console.error("[StorageProxy] local file error:", err);
        res.status(404).send("Storage file not found");
      }
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
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

      res.set("Cache-Control", "public, max-age=3600");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
