import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getListingById, isFavorite, listCategories, listCommunityPosts, listFavorites, listListings } from "./db";
import { categories, communityPosts, favorites, listingImages, listings } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const listingInput = z.object({
  categoryId: z.number().int().positive(),
  titleEn: z.string().min(4).max(180),
  titleAr: z.string().max(180).optional(),
  descriptionEn: z.string().min(20).max(5000),
  descriptionAr: z.string().max(5000).optional(),
  price: z.number().min(0).max(100000000),
  negotiable: z.boolean().default(false),
  exchangeAvailable: z.boolean().default(false),
  location: z.string().min(2).max(120).default("Hurghada"),
  imagePath: z.string().max(600).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: publicProcedure.query(() => listCategories()),
  }),
  listings: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional(), categoryId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(48).default(12), offset: z.number().int().min(0).default(0) }).optional())
      .query(({ input }) => listListings({ ...(input ?? {}), limit: input?.limit ?? 12, offset: input?.offset ?? 0 })),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getListingById(input.id)),
    create: protectedProcedure.input(listingInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const [created] = await db.insert(listings).values({
        sellerId: ctx.user.id,
        categoryId: input.categoryId,
        titleEn: input.titleEn,
        titleAr: input.titleAr || null,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr || null,
        price: input.price.toFixed(2),
        negotiable: input.negotiable,
        exchangeAvailable: input.exchangeAvailable,
        location: input.location,
        status: "pending_review",
        moderationStatus: "pending",
      });
      if (input.imagePath && created.insertId) {
        await db.insert(listingImages).values({ listingId: Number(created.insertId), storagePath: input.imagePath, isCover: true, altText: input.titleEn });
      }
      return { id: Number(created.insertId), status: "pending_review" as const };
    }),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => listFavorites(ctx.user.id)),
    status: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).query(({ ctx, input }) => isFavorite(ctx.user.id, input.listingId)),
    toggle: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, input.listingId))).limit(1);
      if (existing[0]) {
        await db.delete(favorites).where(eq(favorites.id, existing[0].id));
        await db.update(listings).set({ favoritesCount: sql`greatest(${listings.favoritesCount} - 1, 0)` }).where(eq(listings.id, input.listingId));
        return { favorited: false } as const;
      }
      await db.insert(favorites).values({ userId: ctx.user.id, listingId: input.listingId });
      await db.update(listings).set({ favoritesCount: sql`${listings.favoritesCount} + 1` }).where(eq(listings.id, input.listingId));
      return { favorited: true } as const;
    }),
  }),
  community: router({
    list: publicProcedure.query(() => listCommunityPosts()),
    create: protectedProcedure.input(z.object({ category: z.enum(["care", "nutrition", "health", "breeding", "general", "other"]), title: z.string().min(4).max(180), body: z.string().min(10).max(5000) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const [created] = await db.insert(communityPosts).values({ authorId: ctx.user.id, ...input });
      return { id: Number(created.insertId) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
