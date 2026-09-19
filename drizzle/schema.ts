import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 32 }),
  whatsappOptIn: boolean("whatsappOptIn").notNull().default(false),
  phoneVerifiedAt: timestamp("phoneVerifiedAt"),
  area: varchar("area", { length: 120 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 120 }).notNull(),
  nameAr: varchar("nameAr", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("bird"),
  accent: varchar("accent", { length: 40 }).notNull().default("mint"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ activeIdx: index("categories_active_idx").on(table.isActive) }));

export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull().references(() => users.id),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  titleEn: varchar("titleEn", { length: 180 }).notNull(),
  titleAr: varchar("titleAr", { length: 180 }),
  descriptionEn: text("descriptionEn").notNull(),
  descriptionAr: text("descriptionAr"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("EGP"),
  negotiable: boolean("negotiable").notNull().default(false),
  exchangeAvailable: boolean("exchangeAvailable").notNull().default(false),
  location: varchar("location", { length: 120 }).notNull().default("Hurghada"),
  status: mysqlEnum("status", ["draft", "pending_review", "published", "reserved", "sold", "exchanged", "archived"]).notNull().default("pending_review"),
  moderationStatus: mysqlEnum("moderationStatus", ["pending", "approved", "rejected"]).notNull().default("pending"),
  views: int("views").notNull().default(0),
  favoritesCount: int("favoritesCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  browseIdx: index("listings_browse_idx").on(table.status, table.moderationStatus, table.categoryId, table.createdAt),
  sellerIdx: index("listings_seller_idx").on(table.sellerId, table.status),
  locationIdx: index("listings_location_idx").on(table.location),
}));

export const listingImages = mysqlTable("listingImages", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  storagePath: text("storagePath").notNull(),
  altText: varchar("altText", { length: 180 }),
  sortOrder: int("sortOrder").notNull().default(0),
  isCover: boolean("isCover").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ listingIdx: index("listing_images_listing_idx").on(table.listingId, table.sortOrder) }));

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: int("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueFavorite: uniqueIndex("favorites_user_listing_unique").on(table.userId, table.listingId),
  userIdx: index("favorites_user_idx").on(table.userId, table.createdAt),
}));

export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => users.id),
  category: mysqlEnum("category", ["care", "nutrition", "health", "breeding", "general", "other"]).notNull().default("general"),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["published", "hidden", "locked"]).notNull().default("published"),
  likesCount: int("likesCount").notNull().default(0),
  commentsCount: int("commentsCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ feedIdx: index("community_feed_idx").on(table.status, table.createdAt) }));

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: int("buyerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: int("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["open", "blocked", "closed"]).notNull().default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ participantIdx: index("conversations_participant_idx").on(table.buyerId, table.sellerId, table.updatedAt), listingIdx: index("conversations_listing_idx").on(table.listingId) }));

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: int("senderId").notNull().references(() => users.id),
  body: text("body").notNull(),
  attachmentPath: text("attachmentPath"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ conversationIdx: index("messages_conversation_idx").on(table.conversationId, table.createdAt) }));

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  link: varchar("link", { length: 240 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ inboxIdx: index("notifications_inbox_idx").on(table.userId, table.readAt, table.createdAt) }));

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().references(() => users.id),
  targetType: varchar("targetType", { length: 40 }).notNull(),
  targetId: int("targetId").notNull(),
  reason: varchar("reason", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"]).notNull().default("open"),
  resolution: text("resolution"),
  resolvedBy: int("resolvedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, table => ({ queueIdx: index("reports_queue_idx").on(table.status, table.createdAt) }));

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  reviewerId: int("reviewerId").notNull().references(() => users.id),
  sellerId: int("sellerId").notNull().references(() => users.id),
  listingId: int("listingId").notNull().references(() => listings.id),
  rating: int("rating").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ uniqueReview: uniqueIndex("reviews_reviewer_listing_unique").on(table.reviewerId, table.listingId), sellerIdx: index("reviews_seller_idx").on(table.sellerId, table.createdAt) }));

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  targetType: varchar("targetType", { length: 40 }).notNull(),
  targetId: int("targetId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ auditIdx: index("audit_logs_idx").on(table.targetType, table.targetId, table.createdAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
