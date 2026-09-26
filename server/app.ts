import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { registerListingManagementRoutes } from "./listingManagementRoutes";
import { appRouter } from "./routers";
import { scheduledPriceRefresh } from "./scheduledPriceRefresh";
import { createContext } from "./_core/context";
import { ensureAffiliateProductsSchema, getCommunityPostImage } from "./db";

let affiliateSchemaReady: Promise<void> | null = null;

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(async (_req, _res, next) => {
    affiliateSchemaReady ??= ensureAffiliateProductsSchema();
    await affiliateSchemaReady;
    next();
  });

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
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
          process.env.RAILWAY_GIT_COMMIT_SHA ||
          process.env.RENDER_GIT_COMMIT ||
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
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return app;
}
