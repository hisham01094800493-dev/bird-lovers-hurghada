import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  appUpdates,
  categories,
  communityPosts,
  conversations,
  favorites,
  InsertUser,
  listingImages,
  listings,
  messages,
  notificationPreferences,
  notifications,
  reports,
  reviews,
  users,
} from "../drizzle/schema";
import { ADMIN_EMAIL } from "@shared/const";

const PROMOTIONAL_IMAGES: Array<{ match: RegExp; path: string }> = [
  { match: /lorikeet/i, path: "/images/listing-lorikeet.jpg" },
  { match: /parakeet|budgerigar|budgie/i, path: "/images/listing-green-parakeet.jpg" },
  { match: /macaw/i, path: "/images/listing-blue-gold-macaw.jpg" },
  { match: /cockatiel/i, path: "/images/listing-cockatiel.jpg" },
];

function promotionalImageFor(title: string | null | undefined, fallback: string | null | undefined) {
  return PROMOTIONAL_IMAGES.find(entry => entry.match.test(title || ""))?.path || fallback;
}
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function ensureLocalAuthSchema() {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql.raw("ALTER TABLE `users` ADD COLUMN `passwordHash` text NULL"));
  } catch (error) {
    const message = String(error);
    if (!message.toLowerCase().includes("duplicate column") && !message.toLowerCase().includes("already exists")) {
      console.warn("[Database] Local auth schema check failed:", message);
    }
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "passwordHash", "loginMethod", "avatarUrl", "phone", "area", "bio"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.whatsappOptIn !== undefined) { values.whatsappOptIn = user.whatsappOptIn; updateSet.whatsappOptIn = user.whatsappOptIn; }
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

export async function getUserByEmail(email: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1); return result[0];
}

export async function createLocalUser(input: { openId: string; name: string; email: string; passwordHash: string }) {
  const db = await getDb(); if (!db) return undefined;
  await db.insert(users).values({ openId: input.openId, name: input.name, email: input.email, passwordHash: input.passwordHash, loginMethod: "password", lastSignedIn: new Date() });
  return getUserByOpenId(input.openId);
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
  const rows = await db.select({ id: listings.id, titleEn: listings.titleEn, titleAr: listings.titleAr, descriptionEn: listings.descriptionEn, descriptionAr: listings.descriptionAr, price: listings.price, currency: listings.currency, negotiable: listings.negotiable, exchangeAvailable: listings.exchangeAvailable, location: listings.location, status: listings.status, views: listings.views, favoritesCount: listings.favoritesCount, createdAt: listings.createdAt, categoryId: categories.id, categoryNameEn: categories.nameEn, categoryNameAr: categories.nameAr, sellerName: users.name, coverImage: listingImages.storagePath })
    .from(listings).leftJoin(categories, eq(listings.categoryId, categories.id)).leftJoin(users, eq(listings.sellerId, users.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(and(...filters)).orderBy(desc(listings.createdAt)).limit(input.limit).offset(input.offset);
  return rows.map(row => ({ ...row, coverImage: promotionalImageFor(row.titleEn, row.coverImage) || null }));
}

export async function getListingById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: listings.id, titleEn: listings.titleEn, titleAr: listings.titleAr, descriptionEn: listings.descriptionEn, descriptionAr: listings.descriptionAr, price: listings.price, currency: listings.currency, negotiable: listings.negotiable, exchangeAvailable: listings.exchangeAvailable, location: listings.location, status: listings.status, views: listings.views, favoritesCount: listings.favoritesCount, createdAt: listings.createdAt, updatedAt: listings.updatedAt, categoryId: categories.id, categoryNameEn: categories.nameEn, categoryNameAr: categories.nameAr, sellerId: users.id, sellerName: users.name, sellerArea: users.area, sellerAvatar: users.avatarUrl, sellerPhone: users.phone, sellerWhatsAppOptIn: users.whatsappOptIn, sellerPhoneVerifiedAt: users.phoneVerifiedAt, coverImage: listingImages.storagePath })
    .from(listings).leftJoin(categories, eq(listings.categoryId, categories.id)).leftJoin(users, eq(listings.sellerId, users.id)).leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isCover, true))).where(and(eq(listings.id, id), eq(listings.status, "published"), eq(listings.moderationStatus, "approved"))).limit(1);
  if (!rows[0]) return undefined;
  await db.update(listings).set({ views: sql`${listings.views} + 1` }).where(eq(listings.id, id));
  return { ...rows[0], coverImage: promotionalImageFor(rows[0].titleEn, rows[0].coverImage) || null };
}

export async function listListingImages(listingId: number) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select({ id: listingImages.id, storagePath: listingImages.storagePath, altText: listingImages.altText, sortOrder: listingImages.sortOrder, isCover: listingImages.isCover, titleEn: listings.titleEn })
    .from(listingImages).innerJoin(listings, eq(listingImages.listingId, listings.id)).where(and(eq(listingImages.listingId, listingId), eq(listings.status, "published"), eq(listings.moderationStatus, "approved"))).orderBy(asc(listingImages.sortOrder));
  return rows.map((row, index) => ({ id: row.id, storagePath: (index === 0 ? promotionalImageFor(row.titleEn, row.storagePath) : row.storagePath) || "", altText: row.altText, sortOrder: row.sortOrder, isCover: row.isCover }));
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

export async function listAppUpdates() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(appUpdates).orderBy(desc(appUpdates.publishedAt)).limit(20);
}

export async function publishAppUpdate(input: { version: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; link?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const [created] = await db.insert(appUpdates).values(input);
  const updateId = Number(created.insertId);
  const recipients = await db.select({ id: users.id }).from(users).limit(5000);
  let notified = 0;
  for (const recipient of recipients) {
    if (await createNotification(recipient.id, "app_update", "New app update / تحديث جديد", `${input.titleEn} / ${input.titleAr}`, input.link || "/notifications")) notified += 1;
  }
  return { id: updateId, notified } as const;
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
  const rows = await db.select({ id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId, senderName: users.name, body: messages.body, attachmentPath: messages.attachmentPath, attachmentType: messages.attachmentType, attachmentData: messages.attachmentData, readAt: messages.readAt, createdAt: messages.createdAt })
    .from(messages).innerJoin(users, eq(messages.senderId, users.id)).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)).limit(100);
  return rows.map(({ attachmentData, attachmentPath, attachmentType, ...message }) => ({
    ...message,
    attachmentPath: attachmentData && attachmentType ? `data:${attachmentType};base64,${Buffer.from(attachmentData).toString("base64")}` : attachmentPath,
    attachmentType,
  }));
}

export async function listMessageAttachments(limit = 100) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select({
    id: messages.id,
    conversationId: messages.conversationId,
    senderId: messages.senderId,
    senderName: users.name,
    senderEmail: users.email,
    listingTitle: listings.titleEn,
    body: messages.body,
    attachmentPath: messages.attachmentPath,
    attachmentType: messages.attachmentType,
    attachmentData: messages.attachmentData,
    attachmentExpiresAt: messages.attachmentExpiresAt,
    createdAt: messages.createdAt,
  }).from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(listings, eq(conversations.listingId, listings.id))
    .where(sql`${messages.attachmentData} is not null or ${messages.attachmentPath} is not null`)
    .orderBy(desc(messages.createdAt)).limit(Math.min(Math.max(limit, 1), 200));
  return rows.map(({ attachmentData, attachmentPath, attachmentType, ...message }) => ({
    ...message,
    attachmentPath: attachmentData && attachmentType ? `data:${attachmentType};base64,${Buffer.from(attachmentData).toString("base64")}` : attachmentPath,
    attachmentType,
  }));
}

export async function getListingSeller(listingId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: listings.id, sellerId: listings.sellerId, title: listings.titleEn }).from(listings).where(eq(listings.id, listingId)).limit(1); return rows[0];
}

export async function findConversation(listingId: number, buyerId: number, sellerId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(conversations).where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId), eq(conversations.sellerId, sellerId))).limit(1); return rows[0];
}

export async function createConversationMessage(input: { listingId: number; buyerId: number; sellerId: number; body: string; attachmentPath?: string; attachmentData?: Buffer; attachmentType?: string; attachmentExpiresAt?: Date }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  let conversation = await findConversation(input.listingId, input.buyerId, input.sellerId);
  if (!conversation) { const [created] = await db.insert(conversations).values({ listingId: input.listingId, buyerId: input.buyerId, sellerId: input.sellerId }); conversation = await getConversation(Number(created.insertId)); }
  if (!conversation) throw new Error("Conversation could not be created");
  await db.insert(messages).values({ conversationId: conversation.id, senderId: input.buyerId, body: input.body, attachmentPath: input.attachmentPath, attachmentData: input.attachmentData, attachmentType: input.attachmentType, attachmentExpiresAt: input.attachmentExpiresAt });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversation.id));
  await createNotification(input.sellerId, "new_message", "New message about your listing", input.body.slice(0, 140) || "New attachment", `/messages?conversation=${conversation.id}`);
  return conversation;
}

export async function addMessage(conversationId: number, senderId: number, body: string, attachmentData?: Buffer, attachmentType?: string, attachmentExpiresAt?: Date) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const conversation = await getConversation(conversationId); if (!conversation) return undefined;
  await db.insert(messages).values({ conversationId, senderId, body, attachmentData, attachmentType, attachmentExpiresAt });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  const recipientId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
  await createNotification(recipientId, "new_message", "New message", body.slice(0, 140) || "New attachment", `/messages?conversation=${conversationId}`);
  return { success: true } as const;
}

export async function cleanupExpiredMessageAttachments() {
  const db = await getDb(); if (!db) return 0;
  const result = await db.update(messages)
    .set({ attachmentData: null, attachmentPath: null, attachmentType: null, attachmentExpiresAt: null })
    .where(sql`${messages.attachmentExpiresAt} is not null and ${messages.attachmentExpiresAt} < now()`);
  return Number(result[0]?.affectedRows || 0);
}

export async function createNotification(userId: number, type: string, title: string, body: string, link?: string) {
  const db = await getDb(); if (!db) return false;
  const preferenceKey = type === "new_message" ? "newMessage" : type.startsWith("listing_") ? "listingUpdates" : type.startsWith("community_") ? "communityUpdates" : "customUpdates";
  const preferenceRows = await db.select({ enabled: notificationPreferences[preferenceKey] }).from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  if (preferenceRows[0] && preferenceRows[0].enabled === false) return false;
  await db.insert(notifications).values({ userId, type, title, body, link });
  return true;
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb(); if (!db) return { newMessage: true, listingUpdates: true, communityUpdates: true, customUpdates: true };
  const rows = await db.select({ newMessage: notificationPreferences.newMessage, listingUpdates: notificationPreferences.listingUpdates, communityUpdates: notificationPreferences.communityUpdates, customUpdates: notificationPreferences.customUpdates }).from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return rows[0] ?? { newMessage: true, listingUpdates: true, communityUpdates: true, customUpdates: true };
}

export async function updateNotificationPreferences(userId: number, input: { newMessage: boolean; listingUpdates: boolean; communityUpdates: boolean; customUpdates: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.insert(notificationPreferences).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getNotificationPreferences(userId);
}

export async function createCustomNotifications(input: { recipientId?: number; title: string; body: string; link?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const recipients = input.recipientId ? [{ id: input.recipientId }] : await db.select({ id: users.id }).from(users).limit(5000);
  let delivered = 0;
  for (const recipient of recipients) if (await createNotification(recipient.id, "custom", input.title, input.body, input.link)) delivered += 1;
  return delivered;
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

export async function listAdminUsers(limit = 200) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, area: users.area, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
    .from(users).orderBy(desc(users.createdAt)).limit(limit);
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

export async function getProfile(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, phone: users.phone, whatsappOptIn: users.whatsappOptIn, phoneVerifiedAt: users.phoneVerifiedAt, area: users.area, bio: users.bio, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0];
}

export async function updateProfile(userId: number, input: { name?: string; phone?: string; area?: string; bio?: string; whatsappOptIn?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(users).set({ name: input.name, phone: input.phone || null, area: input.area || null, bio: input.bio || null, whatsappOptIn: Boolean(input.whatsappOptIn) }).where(eq(users.id, userId));
  return getProfile(userId);
}

export async function reorderListingImages(userId: number, listingId: number, imageIds: number[]) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const owner = await db.select({ sellerId: listings.sellerId }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!owner[0] || owner[0].sellerId !== userId) return false;
  for (let index = 0; index < imageIds.length; index += 1) await db.update(listingImages).set({ sortOrder: index, isCover: index === 0 }).where(and(eq(listingImages.id, imageIds[index]), eq(listingImages.listingId, listingId)));
  return true;
}

export async function canReviewCompletedListing(reviewerId: number, sellerId: number, listingId: number) {
  const db = await getDb(); if (!db) return false;
  const listing = await db.select({ status: listings.status }).from(listings).where(and(eq(listings.id, listingId), eq(listings.sellerId, sellerId))).limit(1);
  if (!listing[0] || (listing[0].status !== "sold" && listing[0].status !== "exchanged")) return false;
  const conversation = await db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, reviewerId), eq(conversations.sellerId, sellerId))).limit(1);
  return Boolean(conversation[0]);
}

export async function listOpenReports() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: reports.id, targetType: reports.targetType, targetId: reports.targetId, reason: reports.reason, status: reports.status, createdAt: reports.createdAt, reporterName: users.name, reporterEmail: users.email }).from(reports).leftJoin(users, eq(reports.reporterId, users.id)).where(or(eq(reports.status, "open"), eq(reports.status, "reviewing"))).orderBy(asc(reports.createdAt)).limit(80);
}

export async function resolveReport(reportId: number, actorId: number, status: "resolved" | "dismissed", resolution: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const report = await db.select({ targetType: reports.targetType, targetId: reports.targetId }).from(reports).where(eq(reports.id, reportId)).limit(1);
  await db.update(reports).set({ status, resolution, resolvedBy: actorId, resolvedAt: new Date() }).where(eq(reports.id, reportId));
  if (status === "resolved" && report[0]?.targetType === "contact_verification") await db.update(users).set({ phoneVerifiedAt: new Date() }).where(eq(users.id, report[0].targetId));
  await db.insert(auditLogs).values({ actorId, action: `report_${status}`, targetType: "report", targetId: reportId, metadata: JSON.stringify({ resolution }) });
  return true;
}

export async function requestContactVerification(userId: number, phone: string) {
  return createReport({ reporterId: userId, targetType: "contact_verification", targetId: userId, reason: `Verify seller contact ${phone}` });
}

export async function moderateCommunityPost(postId: number, actorId: number, status: "published" | "hidden" | "locked") {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(communityPosts).set({ status }).where(eq(communityPosts.id, postId));
  await db.insert(auditLogs).values({ actorId, action: `post_${status}`, targetType: "community_post", targetId: postId });
  return true;
}

export async function listMyListings(userId: number) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select({ id: listings.id, titleEn: listings.titleEn, status: listings.status, moderationStatus: listings.moderationStatus, createdAt: listings.createdAt }).from(listings).where(eq(listings.sellerId, userId)).orderBy(desc(listings.createdAt)).limit(50);
  return Promise.all(rows.map(async listing => ({ ...listing, images: await db.select({ id: listingImages.id, storagePath: listingImages.storagePath, sortOrder: listingImages.sortOrder, isCover: listingImages.isCover }).from(listingImages).where(eq(listingImages.listingId, listing.id)).orderBy(asc(listingImages.sortOrder)) })));
}

export async function listModerationPosts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: communityPosts.id, title: communityPosts.title, body: communityPosts.body, status: communityPosts.status, createdAt: communityPosts.createdAt, authorName: users.name }).from(communityPosts).leftJoin(users, eq(communityPosts.authorId, users.id)).orderBy(desc(communityPosts.createdAt)).limit(50);
}
