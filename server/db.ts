import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  categories,
  communityPosts,
  conversations,
  favorites,
  InsertUser,
  listingImages,
  listings,
  messages,
  notifications,
  reports,
  reviews,
  users,
} from "../drizzle/schema";
import { ADMIN_EMAIL } from "@shared/const";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
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
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId || user.email === ADMIN_EMAIL) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date(); updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0];
}

export async function listCategories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.id));
}

export async function listListings(input: { search?: string; categoryId?: number; limit: number; offset: number }) {
  const db = await getDb(); if (!db) return [];
  const filters = [eq(listings.status, "published"), eq(listings.moderationStatus, "approved")];
  if (input.categoryId) filters.push(eq(listings.categoryId, input.categoryId));
  if (input.search?.trim()) { const term = `%${input.search.trim()}%`; filters.push(or(like(listings.titleEn, term), like(listings.titleAr, term), like(listings.descriptionEn, term), like(listings.location, term))!); }
  return db.select({ id: listings.id, titleEn: listings.titleEn, titleAr: listings.titleAr, descriptionEn: listings.descriptionEn, descriptionAr: listings.descriptionAr, price: listings.price, currency: listings.currency, negotiable: listings.negotiable, exchangeAvailable: listings.exchangeAvailable, location: listings.location, status: listings.status, views: listings.views, favoritesCount: listings.favoritesCount, createdAt: listings.createdAt, categoryId: categories.id, categoryNameEn: categories.nameEn, categoryNameAr: categories.nameAr, sellerName: users.name, coverImage: listingImages.storagePath })
    .from(listings).leftJoin(categories, eq(listings.categoryId, categories.id)).leftJoin(users, eq(listings.sellerId, users.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(and(...filters)).orderBy(desc(listings.createdAt)).limit(input.limit).offset(input.offset);
}

export async function getListingById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: listings.id, titleEn: listings.titleEn, titleAr: listings.titleAr, descriptionEn: listings.descriptionEn, descriptionAr: listings.descriptionAr, price: listings.price, currency: listings.currency, negotiable: listings.negotiable, exchangeAvailable: listings.exchangeAvailable, location: listings.location, status: listings.status, views: listings.views, favoritesCount: listings.favoritesCount, createdAt: listings.createdAt, updatedAt: listings.updatedAt, categoryId: categories.id, categoryNameEn: categories.nameEn, categoryNameAr: categories.nameAr, sellerId: users.id, sellerName: users.name, sellerArea: users.area, sellerAvatar: users.avatarUrl, sellerPhone: users.phone, coverImage: listingImages.storagePath })
    .from(listings).leftJoin(categories, eq(listings.categoryId, categories.id)).leftJoin(users, eq(listings.sellerId, users.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(and(eq(listings.id, id), eq(listings.status, "published"), eq(listings.moderationStatus, "approved"))).limit(1);
  if (!rows[0]) return undefined;
  await db.update(listings).set({ views: sql`${listings.views} + 1` }).where(eq(listings.id, id));
  return rows[0];
}

export async function isFavorite(userId: number, listingId: number) {
  const db = await getDb(); if (!db) return false;
  const row = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))).limit(1); return Boolean(row[0]);
}

export async function listFavorites(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: listings.id, titleEn: listings.titleEn, titleAr: listings.titleAr, price: listings.price, currency: listings.currency, location: listings.location, coverImage: listingImages.storagePath, categoryNameEn: categories.nameEn, categoryNameAr: categories.nameAr })
    .from(favorites).innerJoin(listings, eq(favorites.listingId, listings.id)).leftJoin(categories, eq(listings.categoryId, categories.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
}

export async function listCommunityPosts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: communityPosts.id, category: communityPosts.category, title: communityPosts.title, body: communityPosts.body, likesCount: communityPosts.likesCount, commentsCount: communityPosts.commentsCount, createdAt: communityPosts.createdAt, authorName: users.name, authorAvatar: users.avatarUrl })
    .from(communityPosts).leftJoin(users, eq(communityPosts.authorId, users.id)).where(eq(communityPosts.status, "published")).orderBy(desc(communityPosts.createdAt)).limit(12);
}

export async function listNotifications(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function unreadNotificationCount(userId: number) {
  const db = await getDb(); if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), sql`${notifications.readAt} is null`));
  return Number(rows[0]?.count || 0);
}

export async function listConversations(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: conversations.id, listingId: conversations.listingId, listingTitle: listings.titleEn, buyerId: conversations.buyerId, sellerId: conversations.sellerId, status: conversations.status, updatedAt: conversations.updatedAt })
    .from(conversations).innerJoin(listings, eq(conversations.listingId, listings.id)).where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId))).orderBy(desc(conversations.updatedAt)).limit(50);
}

export async function getConversation(conversationId: number) {
  const db = await getDb(); if (!db) return undefined;
  const row = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1); return row[0];
}

export async function listMessages(conversationId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId, senderName: users.name, body: messages.body, attachmentPath: messages.attachmentPath, readAt: messages.readAt, createdAt: messages.createdAt })
    .from(messages).innerJoin(users, eq(messages.senderId, users.id)).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)).limit(100);
}

export async function getListingSeller(listingId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: listings.id, sellerId: listings.sellerId, title: listings.titleEn }).from(listings).where(eq(listings.id, listingId)).limit(1); return rows[0];
}

export async function findConversation(listingId: number, buyerId: number, sellerId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(conversations).where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId), eq(conversations.sellerId, sellerId))).limit(1); return rows[0];
}

export async function createConversationMessage(input: { listingId: number; buyerId: number; sellerId: number; body: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  let conversation = await findConversation(input.listingId, input.buyerId, input.sellerId);
  if (!conversation) { const [created] = await db.insert(conversations).values({ listingId: input.listingId, buyerId: input.buyerId, sellerId: input.sellerId }); conversation = await getConversation(Number(created.insertId)); }
  if (!conversation) throw new Error("Conversation could not be created");
  await db.insert(messages).values({ conversationId: conversation.id, senderId: input.buyerId, body: input.body });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversation.id));
  await db.insert(notifications).values({ userId: input.sellerId, type: "new_message", title: "New message about your listing", body: input.body.slice(0, 140), link: `/messages/${conversation.id}` });
  return conversation;
}

export async function addMessage(conversationId: number, senderId: number, body: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const conversation = await getConversation(conversationId); if (!conversation) return undefined;
  await db.insert(messages).values({ conversationId, senderId, body });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  const recipientId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
  await db.insert(notifications).values({ userId: recipientId, type: "new_message", title: "New message", body: body.slice(0, 140), link: `/messages/${conversationId}` });
  return { success: true } as const;
}

export async function createNotification(userId: number, type: string, title: string, body: string, link?: string) {
  const db = await getDb(); if (!db) return;
  await db.insert(notifications).values({ userId, type, title, body, link });
}

export async function getAdminStats() {
  const db = await getDb(); if (!db) return { users: 0, listings: 0, pendingListings: 0, reports: 0, messages: 0 };
  const [userRows, listingRows, pendingRows, reportRows, messageRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(listings),
    db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.moderationStatus, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(or(eq(reports.status, "open"), eq(reports.status, "reviewing"))),
    db.select({ count: sql<number>`count(*)` }).from(messages),
  ]);
  return { users: Number(userRows[0]?.count || 0), listings: Number(listingRows[0]?.count || 0), pendingListings: Number(pendingRows[0]?.count || 0), reports: Number(reportRows[0]?.count || 0), messages: Number(messageRows[0]?.count || 0) };
}

export async function listPendingListings() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: listings.id, titleEn: listings.titleEn, price: listings.price, location: listings.location, status: listings.status, moderationStatus: listings.moderationStatus, createdAt: listings.createdAt, sellerName: users.name, sellerEmail: users.email, coverImage: listingImages.storagePath })
    .from(listings).innerJoin(users, eq(listings.sellerId, users.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(eq(listings.moderationStatus, "pending")).orderBy(asc(listings.createdAt)).limit(50);
}

export async function moderateListing(listingId: number, actorId: number, decision: "approved" | "rejected") {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const listing = await db.select({ sellerId: listings.sellerId, title: listings.titleEn }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing[0]) return false;
  await db.update(listings).set({ moderationStatus: decision, status: decision === "approved" ? "published" : "archived" }).where(eq(listings.id, listingId));
  await db.insert(auditLogs).values({ actorId, action: decision === "approved" ? "listing_approve" : "listing_reject", targetType: "listing", targetId: listingId, metadata: JSON.stringify({ title: listing[0].title }) });
  await createNotification(listing[0].sellerId, `listing_${decision}`, `Listing ${decision}`, decision === "approved" ? "Your listing is now live." : "Your listing needs an update before it can go live.", `/listing/${listingId}`);
  return true;
}

export async function createReport(input: { reporterId: number; targetType: string; targetId: number; reason: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const [created] = await db.insert(reports).values(input); return Number(created.insertId);
}

export async function createReview(input: { reviewerId: number; sellerId: number; listingId: number; rating: number; body: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const [created] = await db.insert(reviews).values(input); return Number(created.insertId);
}
