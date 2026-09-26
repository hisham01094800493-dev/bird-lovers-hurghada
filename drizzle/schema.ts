import {
  boolean,
  decimal,
  customType,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["active", "suspended", "banned"])
    .default("active")
    .notNull(),
  suspendedUntil: timestamp("suspendedUntil"),
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
  table => ({ activeIdx: index("categories_active_idx").on(table.isActive) })
);

export const listings = mysqlTable(
  "listings",
  {
    id: int("id").autoincrement().primaryKey(),
    sellerId: int("sellerId")
      .notNull()
      .references(() => users.id),
    categoryId: int("categoryId")
      .notNull()
      .references(() => categories.id),
    titleEn: varchar("titleEn", { length: 180 }).notNull(),
    titleAr: varchar("titleAr", { length: 180 }),
    descriptionEn: text("descriptionEn").notNull(),
    descriptionAr: text("descriptionAr"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 8 }).notNull().default("EGP"),
    negotiable: boolean("negotiable").notNull().default(false),
    exchangeAvailable: boolean("exchangeAvailable").notNull().default(false),
    location: varchar("location", { length: 120 })
      .notNull()
      .default("Hurghada"),
    status: mysqlEnum("status", [
      "draft",
      "pending_review",
      "published",
      "reserved",
      "sold",
      "exchanged",
      "archived",
    ])
      .notNull()
      .default("pending_review"),
    moderationStatus: mysqlEnum("moderationStatus", [
      "pending",
      "approved",
      "rejected",
    ])
      .notNull()
      .default("pending"),
    views: int("views").notNull().default(0),
    favoritesCount: int("favoritesCount").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    browseIdx: index("listings_browse_idx").on(
      table.status,
      table.moderationStatus,
      table.categoryId,
      table.createdAt
    ),
    sellerIdx: index("listings_seller_idx").on(table.sellerId, table.status),
    locationIdx: index("listings_location_idx").on(table.location),
  })
);

export const listingImages = mysqlTable(
  "listingImages",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    storagePath: text("storagePath").notNull(),
    altText: varchar("altText", { length: 180 }),
    sortOrder: int("sortOrder").notNull().default(0),
    isCover: boolean("isCover").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    listingIdx: index("listing_images_listing_idx").on(
      table.listingId,
      table.sortOrder
    ),
  })
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueFavorite: uniqueIndex("favorites_user_listing_unique").on(
      table.userId,
      table.listingId
    ),
    userIdx: index("favorites_user_idx").on(table.userId, table.createdAt),
  })
);

export const communityPosts = mysqlTable(
  "communityPosts",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id),
    category: mysqlEnum("category", [
      "care",
      "nutrition",
      "health",
      "breeding",
      "general",
      "other",
    ])
      .notNull()
      .default("general"),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    imagePath: text("imagePath"),
    imageMime: varchar("imageMime", { length: 40 }),
    imageData: mediumBlob("imageData"),
    status: mysqlEnum("status", ["published", "hidden", "locked"])
      .notNull()
      .default("published"),
    likesCount: int("likesCount").notNull().default(0),
    commentsCount: int("commentsCount").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    feedIdx: index("community_feed_idx").on(table.status, table.createdAt),
  })
);

export const communityPostLikes = mysqlTable(
  "communityPostLikes",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueLike: uniqueIndex("community_post_user_like_unique").on(
      table.postId,
      table.userId
    ),
    postIdx: index("community_post_likes_post_idx").on(table.postId),
  })
);

export const communityComments = mysqlTable(
  "communityComments",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    postIdx: index("community_comments_post_idx").on(
      table.postId,
      table.createdAt
    ),
  })
);

export const communityReputation = mysqlTable("communityReputation", {
  userId: int("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  points: int("points").notNull().default(0),
  helpfulAnswers: int("helpfulAnswers").notNull().default(0),
  commentsCount: int("commentsCount").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const communityCommentHelpfulVotes = mysqlTable(
  "communityCommentHelpfulVotes",
  {
    id: int("id").autoincrement().primaryKey(),
    commentId: int("commentId")
      .notNull()
      .references(() => communityComments.id, { onDelete: "cascade" }),
    voterId: int("voterId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueVote: uniqueIndex("community_comment_helpful_unique").on(
      table.commentId,
      table.voterId
    ),
    commentIdx: index("community_comment_helpful_comment_idx").on(
      table.commentId
    ),
  })
);

export const conversations = mysqlTable(
  "conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: int("buyerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: int("sellerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["open", "blocked", "closed"])
      .notNull()
      .default("open"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    participantIdx: index("conversations_participant_idx").on(
      table.buyerId,
      table.sellerId,
      table.updatedAt
    ),
    listingIdx: index("conversations_listing_idx").on(table.listingId),
  })
);

export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: int("senderId")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    attachmentPath: text("attachmentPath"),
    attachmentType: varchar("attachmentType", { length: 80 }),
    attachmentData: mediumBlob("attachmentData"),
    attachmentExpiresAt: timestamp("attachmentExpiresAt"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    conversationIdx: index("messages_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
  })
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    link: varchar("link", { length: 240 }),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    inboxIdx: index("notifications_inbox_idx").on(
      table.userId,
      table.readAt,
      table.createdAt
    ),
  })
);

export const lostFoundReports = mysqlTable(
  "lostFoundReports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["lost", "found"]).notNull(),
    birdName: varchar("birdName", { length: 160 }).notNull(),
    description: text("description").notNull(),
    area: varchar("area", { length: 120 }).notNull(),
    photoUrl: text("photoUrl"),
    contactNote: varchar("contactNote", { length: 240 }),
    status: mysqlEnum("status", ["open", "reunited", "closed"])
      .notNull()
      .default("open"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    feedIdx: index("lost_found_feed_idx").on(
      table.status,
      table.area,
      table.createdAt
    ),
    reporterIdx: index("lost_found_reporter_idx").on(
      table.reporterId,
      table.status
    ),
  })
);

export const notificationPreferences = mysqlTable(
  "notificationPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    newMessage: boolean("newMessage").notNull().default(true),
    listingUpdates: boolean("listingUpdates").notNull().default(true),
    communityUpdates: boolean("communityUpdates").notNull().default(true),
    customUpdates: boolean("customUpdates").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: uniqueIndex("notification_preferences_user_unique").on(
      table.userId
    ),
  })
);

export const appUpdates = mysqlTable(
  "appUpdates",
  {
    id: int("id").autoincrement().primaryKey(),
    version: varchar("version", { length: 40 }).notNull(),
    titleEn: varchar("titleEn", { length: 180 }).notNull(),
    titleAr: varchar("titleAr", { length: 180 }).notNull(),
    bodyEn: text("bodyEn").notNull(),
    bodyAr: text("bodyAr").notNull(),
    link: varchar("link", { length: 240 }),
    publishedAt: timestamp("publishedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    publishedIdx: index("app_updates_published_idx").on(table.publishedAt),
  })
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId")
      .notNull()
      .references(() => users.id),
    targetType: varchar("targetType", { length: 40 }).notNull(),
    targetId: int("targetId").notNull(),
    reason: varchar("reason", { length: 180 }).notNull(),
    status: mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"])
      .notNull()
      .default("open"),
    resolution: text("resolution"),
    resolvedBy: int("resolvedBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => ({
    queueIdx: index("reports_queue_idx").on(table.status, table.createdAt),
  })
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    reviewerId: int("reviewerId")
      .notNull()
      .references(() => users.id),
    sellerId: int("sellerId")
      .notNull()
      .references(() => users.id),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id),
    rating: int("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    uniqueReview: uniqueIndex("reviews_reviewer_listing_unique").on(
      table.reviewerId,
      table.listingId
    ),
    sellerIdx: index("reviews_seller_idx").on(table.sellerId, table.createdAt),
  })
);

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorId: int("actorId").references(() => users.id),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("targetType", { length: 40 }).notNull(),
    targetId: int("targetId"),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    auditIdx: index("audit_logs_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt
    ),
  })
);

export const affiliateProducts = mysqlTable(
  "affiliateProducts",
  {
    id: varchar("id", { length: 80 }).primaryKey(),
    category: mysqlEnum("category", ["food", "care", "housing"])
      .notNull()
      .default("food"),
    nameEn: varchar("nameEn", { length: 180 }).notNull(),
    nameAr: varchar("nameAr", { length: 180 }).notNull(),
    descriptionEn: text("descriptionEn").notNull(),
    descriptionAr: text("descriptionAr").notNull(),
    priceEn: varchar("priceEn", { length: 120 }).notNull(),
    priceAr: varchar("priceAr", { length: 120 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
    affiliateUrl: text("affiliateUrl").notNull(),
    noonUrl: text("noonUrl").notNull().default(""),
    noonCoupon: varchar("noonCoupon", { length: 120 }).notNull().default(""),
    tagEn: varchar("tagEn", { length: 80 }).notNull(),
    tagAr: varchar("tagAr", { length: 80 }).notNull(),
    isActive: boolean("isActive").notNull().default(true),
    sortOrder: int("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activeIdx: index("affiliate_products_active_idx").on(
      table.isActive,
      table.sortOrder
    ),
  })
);

export const priceGuide = mysqlTable(
  "priceGuide",
  {
    id: varchar("id", { length: 80 }).primaryKey(),
    birdEn: varchar("birdEn", { length: 120 }).notNull(),
    birdAr: varchar("birdAr", { length: 120 }).notNull(),
    range: varchar("range", { length: 80 }).notNull(),
    sourceEn: varchar("sourceEn", { length: 240 }).notNull(),
    sourceAr: varchar("sourceAr", { length: 240 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 600 }).notNull(),
    checkedOn: varchar("checkedOn", { length: 10 }).notNull(),
    noteEn: text("noteEn").notNull(),
    noteAr: text("noteAr").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    checkedIdx: index("price_guide_checked_idx").on(table.checkedOn),
  })
);

export const priceGuideDrafts = mysqlTable(
  "priceGuideDrafts",
  {
    id: int("id").autoincrement().primaryKey(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .notNull()
      .default("pending"),
    sourceSummary: text("sourceSummary").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    collectedOn: varchar("collectedOn", { length: 10 }).notNull(),
    payload: text("payload").notNull(),
    reviewedBy: int("reviewedBy").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    statusIdx: index("price_guide_drafts_status_idx").on(
      table.status,
      table.createdAt
    ),
  })
);

export const seasonalCareTips = mysqlTable(
  "seasonalCareTips",
  {
    id: int("id").autoincrement().primaryKey(),
    seasonKey: varchar("seasonKey", { length: 80 }).notNull().unique(),
    titleEn: varchar("titleEn", { length: 180 }).notNull(),
    titleAr: varchar("titleAr", { length: 180 }).notNull(),
    bodyEn: text("bodyEn").notNull(),
    bodyAr: text("bodyAr").notNull(),
    icon: varchar("icon", { length: 40 }).notNull().default("sun"),
    accent: varchar("accent", { length: 20 }).notNull().default("#76a68f"),
    startMonth: int("startMonth").notNull(),
    endMonth: int("endMonth").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    activeIdx: index("seasonal_care_tips_active_idx").on(
      table.isActive,
      table.startMonth,
      table.endMonth
    ),
  })
);

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
export type LostFoundReport = typeof lostFoundReports.$inferSelect;
export type AppUpdate = typeof appUpdates.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AffiliateProduct = typeof affiliateProducts.$inferSelect;
export type PriceGuideItem = typeof priceGuide.$inferSelect;
export type PriceGuideDraft = typeof priceGuideDrafts.$inferSelect;
