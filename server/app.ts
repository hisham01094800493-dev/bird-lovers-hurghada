import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { registerListingManagementRoutes } from "./listingManagementRoutes";
import { appRouter } from "./routers";
import { scheduledPriceRefresh } from "./scheduledPriceRefresh";
import { createContext } from "./_core/context";
import { cleanupExpiredMessageAttachments, getDb } from "./db";
import { ENV } from "./_core/env";

export function createApp() {
  if (ENV.isProduction && !ENV.databaseUrl) throw new Error("DATABASE_URL is required in production");
  if (ENV.isProduction && !process.env.DB_CA_CERT) throw new Error("DB_CA_CERT is required in production");
  if (ENV.isProduction && [ENV.s3Endpoint, ENV.s3Bucket, ENV.s3AccessKeyId, ENV.s3SecretAccessKey, ENV.s3PublicUrl, ENV.cookieSecret].some(value => !value)) throw new Error("S3_* storage settings and JWT_SECRET are required in production");
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  app.get("/health", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ status: "degraded", database: "unavailable" });
      await db.execute("select 1");
      return res.status(200).json({ status: "ok", database: "ok" });
    } catch {
      return res.status(503).json({ status: "degraded", database: "error" });
    }
  });
  app.post("/api/cron/cleanup-message-attachments", async (req, res) => {
    const expected = process.env.CRON_SECRET;
    if (!expected || req.header("authorization") !== `Bearer ${expected}`) return res.status(401).json({ message: "Unauthorized" });
    const deleted = await cleanupExpiredMessageAttachments();
    return res.json({ success: true, deleted });
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
