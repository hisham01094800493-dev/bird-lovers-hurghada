import { COOKIE_NAME } from "@shared/const";
import { ADMIN_EMAIL } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { communityPosts, favorites, listingImages, listings, notifications } from "../drizzle/schema";
import { addMessage, canReviewCompletedListing, createConversationMessage, createCustomNotifications, createNotification, createReport, createReview, getAdminStats, getConversation, getDb, getListingById, getListingSeller, getNotificationPreferences, getProfile, isFavorite, listCategories, listCommunityPosts, listConversations, listFavorites, listListings, listMessages, listModerationPosts, listMyListings, listNotifications, listOpenReports, listPendingListings, moderateCommunityPost, moderateListing, reorderListingImages, requestContactVerification, resolveReport, unreadNotificationCount, updateNotificationPreferences, updateProfile } from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.email !== ADMIN_EMAIL) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const listingInput = z.object({
  categoryId: z.number().int().positive(), titleEn: z.string().min(4).max(180), titleAr: z.string().max(180).optional(), descriptionEn: z.string().min(20).max(5000), descriptionAr: z.string().max(5000).optional(), price: z.number().min(0).max(100000000), negotiable: z.boolean().default(false), exchangeAvailable: z.boolean().default(false), location: z.string().min(2).max(120).default("Hurghada"), imageData: z.array(z.string().max(7000000)).max(6).optional(), imagePath: z.string().max(600).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  categories: router({ list: publicProcedure.query(() => listCategories()) }),
  listings: router({
    list: publicProcedure.input(z.object({ search: z.string().optional(), categoryId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(48).default(12), offset: z.number().int().min(0).default(0) }).optional()).query(({ input }) => listListings({ search: input?.search, categoryId: input?.categoryId, limit: input?.limit ?? 12, offset: input?.offset ?? 0 })),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getListingById(input.id)),
    mine: protectedProcedure.query(({ ctx }) => listMyListings(ctx.user.id)),
    create: protectedProcedure.input(listingInput).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const imagePaths: string[] = input.imagePath ? [input.imagePath] : [];
      for (let index = 0; index < (input.imageData || []).length; index += 1) {
        const imageData = (input.imageData || [])[index];
        const match = imageData.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Use PNG, JPEG, or WebP images" });
        const mime = match[1];
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.byteLength > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Each image must be under 5MB" });
        let normalized: Buffer;
        try {
          const pipeline = sharp(buffer, { failOn: "error" });
          const metadata = await pipeline.metadata();
          if (!metadata.width || !metadata.height || metadata.width < 320 || metadata.height < 320) throw new Error("Image dimensions are too small");
          normalized = await pipeline.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Images must be valid and at least 320×320 pixels" });
        }
        imagePaths.push((await storagePut(`listings/${ctx.user.id}/listing-${index}.webp`, normalized, "image/webp")).url);
      }
      const [created] = await db.insert(listings).values({ sellerId: ctx.user.id, categoryId: input.categoryId, titleEn: input.titleEn, titleAr: input.titleAr || null, descriptionEn: input.descriptionEn, descriptionAr: input.descriptionAr || null, price: input.price.toFixed(2), negotiable: input.negotiable, exchangeAvailable: input.exchangeAvailable, location: input.location, status: "pending_review", moderationStatus: "pending" });
      if (created.insertId && imagePaths.length) await db.insert(listingImages).values(imagePaths.map((storagePath, index) => ({ listingId: Number(created.insertId), storagePath, isCover: index === 0, sortOrder: index, altText: input.titleEn })));
      await createNotification(ctx.user.id, "listing_submitted", "Listing submitted", "Your listing is in the community review queue.", `/listing/${created.insertId}`);
      return { id: Number(created.insertId), status: "pending_review" as const };
    }),
    reorderImages: protectedProcedure.input(z.object({ listingId: z.number().int().positive(), imageIds: z.array(z.number().int().positive()).max(6) })).mutation(({ ctx, input }) => reorderListingImages(ctx.user.id, input.listingId, input.imageIds)),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => listFavorites(ctx.user.id)),
    status: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).query(({ ctx, input }) => isFavorite(ctx.user.id, input.listingId)),
    toggle: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, input.listingId))).limit(1);
      if (existing[0]) { await db.delete(favorites).where(eq(favorites.id, existing[0].id)); await db.update(listings).set({ favoritesCount: sql`greatest(${listings.favoritesCount} - 1, 0)` }).where(eq(listings.id, input.listingId)); return { favorited: false } as const; }
      await db.insert(favorites).values({ userId: ctx.user.id, listingId: input.listingId }); await db.update(listings).set({ favoritesCount: sql`${listings.favoritesCount} + 1` }).where(eq(listings.id, input.listingId)); return { favorited: true } as const;
    }),
  }),
  community: router({
    list: publicProcedure.query(() => listCommunityPosts()),
    create: protectedProcedure.input(z.object({ category: z.enum(["care", "nutrition", "health", "breeding", "general", "other"]), title: z.string().min(4).max(180), body: z.string().min(10).max(5000) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); const [created] = await db.insert(communityPosts).values({ authorId: ctx.user.id, ...input }); return { id: Number(created.insertId) }; }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => unreadNotificationCount(ctx.user.id)),
    preferences: protectedProcedure.query(({ ctx }) => getNotificationPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure.input(z.object({ newMessage: z.boolean(), listingUpdates: z.boolean(), communityUpdates: z.boolean(), customUpdates: z.boolean() })).mutation(({ ctx, input }) => updateNotificationPreferences(ctx.user.id, input)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id))); return { success: true } as const; }),
  }),
  messages: router({
    conversations: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),
    byConversation: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(async ({ ctx, input }) => { const conversation = await getConversation(input.conversationId); if (!conversation || (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN" }); return listMessages(input.conversationId); }),
    start: protectedProcedure.input(z.object({ listingId: z.number().int().positive(), body: z.string().min(1).max(3000) })).mutation(async ({ ctx, input }) => { const listing = await getListingSeller(input.listingId); if (!listing) throw new TRPCError({ code: "NOT_FOUND" }); if (listing.sellerId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot message yourself" }); const conversation = await createConversationMessage({ listingId: input.listingId, buyerId: ctx.user.id, sellerId: listing.sellerId, body: input.body }); return { conversationId: conversation.id }; }),
    send: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), body: z.string().min(1).max(3000) })).mutation(async ({ ctx, input }) => { const conversation = await getConversation(input.conversationId); if (!conversation || (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN" }); return addMessage(input.conversationId, ctx.user.id, input.body); }),
  }),
  reports: router({ create: protectedProcedure.input(z.object({ targetType: z.enum(["listing", "user", "post", "conversation"]), targetId: z.number().int().positive(), reason: z.string().min(5).max(180) })).mutation(({ ctx, input }) => createReport({ reporterId: ctx.user.id, ...input })) }),
  reviews: router({ create: protectedProcedure.input(z.object({ sellerId: z.number().int().positive(), listingId: z.number().int().positive(), rating: z.number().int().min(1).max(5), body: z.string().min(10).max(1200) })).mutation(async ({ ctx, input }) => { if (ctx.user.id === input.sellerId) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot review yourself" }); if (!(await canReviewCompletedListing(ctx.user.id, input.sellerId, input.listingId))) throw new TRPCError({ code: "FORBIDDEN", message: "Reviews unlock after a completed transaction" }); return createReview({ reviewerId: ctx.user.id, ...input }); }) }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    update: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), phone: z.string().max(32).optional(), area: z.string().max(120).optional(), bio: z.string().max(600).optional(), whatsappOptIn: z.boolean() })).mutation(({ ctx, input }) => updateProfile(ctx.user.id, input)),
    requestContactVerification: protectedProcedure.input(z.object({ phone: z.string().min(7).max(32) })).mutation(({ ctx, input }) => requestContactVerification(ctx.user.id, input.phone)),
  }),
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),
    pendingListings: adminProcedure.query(() => listPendingListings()),
    moderationPosts: adminProcedure.query(() => listModerationPosts()),
    sendCustomNotification: adminProcedure.input(z.object({ recipientId: z.number().int().positive().optional(), title: z.string().min(3).max(180), body: z.string().min(5).max(1000), link: z.string().max(240).optional() })).mutation(async ({ input }) => ({ delivered: await createCustomNotifications(input) })),
    moderateListing: adminProcedure.input(z.object({ listingId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]) })).mutation(({ ctx, input }) => moderateListing(input.listingId, ctx.user.id, input.decision)),
    openReports: adminProcedure.query(() => listOpenReports()),
    resolveReport: adminProcedure.input(z.object({ reportId: z.number().int().positive(), status: z.enum(["resolved", "dismissed"]), resolution: z.string().min(3).max(500) })).mutation(({ ctx, input }) => resolveReport(input.reportId, ctx.user.id, input.status, input.resolution)),
    moderatePost: adminProcedure.input(z.object({ postId: z.number().int().positive(), status: z.enum(["published", "hidden", "locked"]) })).mutation(({ ctx, input }) => moderateCommunityPost(input.postId, ctx.user.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
