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
  area: varchar("area", { length: 120 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    nameEn: varchar("nameEn", { length: 120 }).notNull(),
    nameAr: varchar("nameAr", { length: 120 }).notNull(),
    icon: varchar("icon", { length: 40 }).notNull().default("bird"),
    accent: varchar("accent", { length: 40 }).notNull().default("mint"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ activeIdx: index("categories_active_idx").on(table.isActive) }),
);

export const listings = mysqlTable(
  "listings",
  {
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
  },
  table => ({
    browseIdx: index("listings_browse_idx").on(table.status, table.moderationStatus, table.categoryId, table.createdAt),
    sellerIdx: index("listings_seller_idx").on(table.sellerId, table.status),
    locationIdx: index("listings_location_idx").on(table.location),
  }),
);

export const listingImages = mysqlTable(
  "listingImages",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
    storagePath: text("storagePath").notNull(),
    altText: varchar("altText", { length: 180 }),
    sortOrder: int("sortOrder").notNull().default(0),
    isCover: boolean("isCover").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ listingIdx: index("listing_images_listing_idx").on(table.listingId, table.sortOrder) }),
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    listingId: int("listingId").notNull().references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueFavorite: uniqueIndex("favorites_user_listing_unique").on(table.userId, table.listingId),
    userIdx: index("favorites_user_idx").on(table.userId, table.createdAt),
  }),
);

export const communityPosts = mysqlTable(
  "communityPosts",
  {
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
  },
  table => ({ feedIdx: index("community_feed_idx").on(table.status, table.createdAt) }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
