import type { Express, Request, Response } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { listingImages, listings } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";

async function currentUser(req: Request) {
  try { return await sdk.authenticateRequest(req); } catch { return null; }
}

function bodyValue(value: unknown, fallback = "") { return typeof value === "string" ? value.trim() : fallback; }
async function storeListingImage(userId: number, listingId: number, index: number, value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) throw new Error("Use PNG, JPEG, or WebP images");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength > 5_000_000) throw new Error("Each image must be under 5MB");
  return (await storagePut(`listings/${userId}/listing-${listingId}-${Date.now()}-${index}.webp`, buffer, match[1])).url;
}

export function registerListingManagementRoutes(app: Express) {
  app.get("/api/listings/mine", async (req: Request, res: Response) => {
    const user = await currentUser(req); if (!user) return res.status(401).json({ message: "Authentication required" });
    const db = await getDb(); if (!db) return res.status(503).json({ message: "Database is not available" });
    const rows = await db.select().from(listings).where(eq(listings.sellerId, user.id)).orderBy(desc(listings.createdAt));
    const result = await Promise.all(rows.map(async listing => ({ ...listing, images: await db.select().from(listingImages).where(eq(listingImages.listingId, listing.id)).orderBy(asc(listingImages.sortOrder)) })));
    return res.json(result);
  });

  app.patch("/api/listings/:id", async (req: Request, res: Response) => {
    const user = await currentUser(req); if (!user) return res.status(401).json({ message: "Authentication required" });
    const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid listing id" });
    const db = await getDb(); if (!db) return res.status(503).json({ message: "Database is not available" });
    const existing = await db.select({ id: listings.id }).from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, user.id))).limit(1);
    if (!existing[0]) return res.status(404).json({ message: "Listing not found" });
    const input = req.body || {};
    const titleEn = bodyValue(input.titleEn); const descriptionEn = bodyValue(input.descriptionEn); const price = bodyValue(input.price);
    if (titleEn.length < 4 || descriptionEn.length < 20 || !price) return res.status(400).json({ message: "Title, description, and price are required" });
    await db.update(listings).set({ titleEn, titleAr: bodyValue(input.titleAr) || null, descriptionEn, descriptionAr: bodyValue(input.descriptionAr) || null, price, location: bodyValue(input.location, "Hurghada"), status: "pending_review", moderationStatus: "pending" }).where(and(eq(listings.id, id), eq(listings.sellerId, user.id)));
    const imageData = Array.isArray(input.imageData) ? input.imageData.filter((value: unknown): value is string => typeof value === "string").slice(0, 6) : [];
    if (imageData.length) {
      const existingImages = await db.select({ id: listingImages.id }).from(listingImages).where(eq(listingImages.listingId, id)).orderBy(asc(listingImages.sortOrder));
      const urls = await Promise.all(imageData.map((value: string, index: number) => storeListingImage(user.id, id, index, value)));
      await db.insert(listingImages).values(urls.map((storagePath, index) => ({ listingId: id, storagePath, isCover: existingImages.length === 0 && index === 0, sortOrder: existingImages.length + index, altText: titleEn })));
    }
    return res.json({ success: true, id, status: "pending_review" });
  });

  app.delete("/api/listings/:id/images/:imageId", async (req: Request, res: Response) => {
    const user = await currentUser(req); if (!user) return res.status(401).json({ message: "Authentication required" });
    const listingId = Number(req.params.id); const imageId = Number(req.params.imageId); const db = await getDb(); if (!db) return res.status(503).json({ message: "Database is not available" });
    const existing = await db.select({ imageId: listingImages.id }).from(listingImages).innerJoin(listings, eq(listingImages.listingId, listings.id)).where(and(eq(listingImages.id, imageId), eq(listingImages.listingId, listingId), eq(listings.sellerId, user.id))).limit(1);
    if (!existing[0]) return res.status(404).json({ message: "Image not found" });
    await db.delete(listingImages).where(eq(listingImages.id, imageId));
    const remaining = await db.select({ id: listingImages.id }).from(listingImages).where(eq(listingImages.listingId, listingId)).orderBy(asc(listingImages.sortOrder));
    for (let index = 0; index < remaining.length; index += 1) await db.update(listingImages).set({ sortOrder: index, isCover: index === 0 }).where(eq(listingImages.id, remaining[index].id));
    return res.json({ success: true });
  });

  app.delete("/api/listings/:id", async (req: Request, res: Response) => {
    const user = await currentUser(req); if (!user) return res.status(401).json({ message: "Authentication required" });
    const id = Number(req.params.id); const db = await getDb(); if (!db) return res.status(503).json({ message: "Database is not available" });
    const existing = await db.select({ id: listings.id }).from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, user.id))).limit(1);
    if (!existing[0]) return res.status(404).json({ message: "Listing not found" });
    await db.delete(listings).where(and(eq(listings.id, id), eq(listings.sellerId, user.id)));
    return res.json({ success: true });
  });
}
