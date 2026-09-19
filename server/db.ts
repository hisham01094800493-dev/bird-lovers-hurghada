import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  communityPosts,
  favorites,
  InsertUser,
  listingImages,
  listings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "avatarUrl", "phone", "area", "bio"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.id));
}

export async function listListings(input: { search?: string; categoryId?: number; limit: number; offset: number }) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(listings.status, "published"), eq(listings.moderationStatus, "approved")];
  if (input.categoryId) filters.push(eq(listings.categoryId, input.categoryId));
  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    filters.push(or(like(listings.titleEn, term), like(listings.titleAr, term), like(listings.descriptionEn, term), like(listings.location, term))!);
  }
  return db
    .select({
      id: listings.id,
      titleEn: listings.titleEn,
      titleAr: listings.titleAr,
      descriptionEn: listings.descriptionEn,
      descriptionAr: listings.descriptionAr,
      price: listings.price,
      currency: listings.currency,
      negotiable: listings.negotiable,
      exchangeAvailable: listings.exchangeAvailable,
      location: listings.location,
      status: listings.status,
      views: listings.views,
      favoritesCount: listings.favoritesCount,
      createdAt: listings.createdAt,
      categoryId: categories.id,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      sellerName: users.name,
      coverImage: listingImages.storagePath,
    })
    .from(listings)
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true)))
    .where(and(...filters))
    .orderBy(desc(listings.createdAt))
    .limit(input.limit)
    .offset(input.offset);
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      id: listings.id,
      titleEn: listings.titleEn,
      titleAr: listings.titleAr,
      descriptionEn: listings.descriptionEn,
      descriptionAr: listings.descriptionAr,
      price: listings.price,
      currency: listings.currency,
      negotiable: listings.negotiable,
      exchangeAvailable: listings.exchangeAvailable,
      location: listings.location,
      status: listings.status,
      views: listings.views,
      favoritesCount: listings.favoritesCount,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
      categoryId: categories.id,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      sellerId: users.id,
      sellerName: users.name,
      sellerArea: users.area,
      sellerAvatar: users.avatarUrl,
      coverImage: listingImages.storagePath,
    })
    .from(listings)
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true)))
    .where(and(eq(listings.id, id), eq(listings.status, "published"), eq(listings.moderationStatus, "approved")))
    .limit(1);
  if (!rows[0]) return undefined;
  await db.update(listings).set({ views: sql`${listings.views} + 1` }).where(eq(listings.id, id));
  return rows[0];
}

export async function isFavorite(userId: number, listingId: number) {
  const db = await getDb();
  if (!db) return false;
  const row = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))).limit(1);
  return Boolean(row[0]);
}

export async function listFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: listings.id,
      titleEn: listings.titleEn,
      titleAr: listings.titleAr,
      price: listings.price,
      currency: listings.currency,
      location: listings.location,
      coverImage: listingImages.storagePath,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
    })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true)))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function listCommunityPosts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: communityPosts.id,
      category: communityPosts.category,
      title: communityPosts.title,
      body: communityPosts.body,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      createdAt: communityPosts.createdAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.status, "published"))
    .orderBy(desc(communityPosts.createdAt))
    .limit(12);
}
