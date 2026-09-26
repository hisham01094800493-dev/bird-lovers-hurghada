import { timingSafeEqual } from "node:crypto";
import express, { type Express, type Request } from "express";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { cleanupExpiredMessageAttachments } from "../db";
import { registerListingManagementRoutes } from "../listingManagementRoutes";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { createContext } from "./context";
import { appRouter } from "../routers";
import { scheduledPriceRefresh } from "../scheduledPriceRefresh";

function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !token) return false;

  const expected = Buffer.from(secret);
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function configureApplication(app: Express): Express {
  app.set("trust proxy", 1);
  const requestLimit = process.env.VERCEL ? "4mb" : "50mb";
  app.use(express.json({ limit: requestLimit }));
  app.use(express.urlencoded({ limit: requestLimit, extended: true }));

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/api/version", (_req, res) =>
    res
      .setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
      .json({
        version:
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.RAILWAY_GIT_COMMIT_SHA ||
          process.env.RENDER_GIT_COMMIT ||
          process.env.GIT_COMMIT ||
          process.env.npm_package_version ||
          "development",
      }),
  );

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerListingManagementRoutes(app);
  app.post("/api/scheduled/price-guide-refresh", scheduledPriceRefresh);
  app.get("/api/cron/cleanup-expired-attachments", async (req, res) => {
    if (!isAuthorizedCron(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const cleaned = await cleanupExpiredMessageAttachments();
      res.status(200).json({ status: "ok", cleaned });
    } catch (error) {
      console.error("[Cron] Attachment cleanup failed", error);
      res.status(500).json({ error: "Attachment cleanup failed" });
    }
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}

export function configureVercelSpaFallback(app: Express): Express {
  const indexPath = path.resolve(process.cwd(), "public", "index.html");
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/manus-storage/")) {
      next();
      return;
    }
    res.sendFile(indexPath);
  });
  return app;
}

export function createApplication(): Express {
  return configureApplication(express());
}

export function createVercelApplication(): Express {
  return configureVercelSpaFallback(configureApplication(express()));
}
