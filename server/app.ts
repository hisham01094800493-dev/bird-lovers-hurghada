import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { registerListingManagementRoutes } from "./listingManagementRoutes";
import { appRouter } from "./routers";
import { scheduledPriceRefresh } from "./scheduledPriceRefresh";
import { createContext } from "./_core/context";
import {
  checkDatabase,
  cleanupExpiredMessageAttachments,
  getCommunityPostImage,
} from "./db";
import { assertProductionConfig } from "./_core/env";
import { assertStorageConfigured } from "./storage";

export function createApp() {
  const app = express();
  assertProductionConfig();
  assertStorageConfigured();

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  app.get("/health", async (_req, res) => {
    const database = await checkDatabase();
    return res
      .status(database.ok ? 200 : 503)
      .json({ status: database.ok ? "ok" : "degraded", database });
  });
  app.get("/api/community-posts/:id/image", async (req, res) => {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId < 1) return res.status(400).send("Invalid post image");
    const image = await getCommunityPostImage(postId);
    if (!image?.imageData) return res.status(404).send("Image not found");
    res.setHeader("Content-Type", image.imageMime || "image/webp");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const imageData = Buffer.isBuffer(image.imageData)
      ? image.imageData
      : Buffer.from(image.imageData as Uint8Array);
    res.setHeader("Content-Length", imageData.byteLength);
    return res.send(imageData);
  });
  app.get("/api/version", (_req, res) =>
    res
      .setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
      .json({
        version:
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.GIT_COMMIT ||
          process.env.npm_package_version ||
          "development",
      }),
  );

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerListingManagementRoutes(app);
  app.all("/api/scheduled/price-guide-refresh", scheduledPriceRefresh);
  app.post("/api/scheduled/message-attachments-cleanup", async (req, res) => {
    if (!process.env.CRON_SECRET || req.header("x-cron-secret") !== process.env.CRON_SECRET)
      return res.status(401).json({ error: "Unauthorized" });
    const deleted = await cleanupExpiredMessageAttachments();
    return res.json({ ok: true, deleted });
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return app;
}
