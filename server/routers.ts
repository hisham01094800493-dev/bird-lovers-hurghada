import { COOKIE_NAME } from "@shared/const";
import { ADMIN_EMAIL } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import {
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import sharp from "sharp";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { validateChatUpload } from "./chatUploads";
import {
  communityPosts,
  favorites,
  listingImages,
  listings,
  notifications,
} from "../drizzle/schema";
import {
  addMessage,
  canReviewCompletedListing,
  createCommunityComment,
  createConversationMessage,
  createCustomNotifications,
  createLocalUser,
  createLostFoundReport,
  createNotification,
  createPriceGuideItem,
  createReport,
  createReview,
  deletePriceGuideItem,
  getAdminStats,
  getConversation,
  getDb,
  getListingById,
  hasCommunityLike,
  listAdminUsers,
  updateAdminUser,
  getListingSeller,
  getNotificationPreferences,
  getProfile,
  getUserByEmail,
  isFavorite,
  listAppUpdates,
  listCategories,
  listCommunityComments,
  listCommunityPosts,
  listConversations,
  listFavorites,
  listListingImages,
  listListings,
  listLostFoundReports,
  listMessageAttachments,
  listMessages,
  listModerationPosts,
  listMyListings,
  listNotifications,
  listOpenReports,
  listPendingListings,
  listPendingPriceGuideDrafts,
  listPriceGuide,
  listSeasonalCareTips,
  moderateCommunityPost,
  approvePriceGuideDraft,
  rejectPriceGuideDraft,
  moderateListing,
  publishAppUpdate,
  reorderListingImages,
  requestContactVerification,
  resolveReport,
  resolveLostFoundReport,
  toggleCommunityLike,
  unreadNotificationCount,
  updateNotificationPreferences,
  updatePriceGuideItem,
  updateProfile,
  upsertUser,
} from "./db";

const scrypt = promisify(nodeScrypt);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password: string, stored: string) {
  const [, salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const expected = Buffer.from(encoded, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function publicUser(
  user: NonNullable<Awaited<ReturnType<typeof getUserByEmail>>>
) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.email !== ADMIN_EMAIL)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  return next({ ctx });
});

const messageAttachmentInput = z.object({
  attachmentData: z.string().max(12_000_000).optional(),
  attachmentType: z
    .enum([
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
    ])
    .optional(),
});

const CHAT_ATTACHMENT_RETENTION_DAYS = Math.max(
  1,
  Number(process.env.CHAT_ATTACHMENT_RETENTION_DAYS || 90)
);

const HURGHADA_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FCairo&forecast_days=1";

async function getHurghadaWeather() {
  try {
    const response = await fetch(HURGHADA_WEATHER_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      throw new Error(`Weather provider returned ${response.status}`);
    const payload = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };
    const temperature =
      payload.current?.temperature_2m ??
      payload.daily?.temperature_2m_max?.[0] ??
      null;
    const max = payload.daily?.temperature_2m_max?.[0] ?? temperature;
    const level =
      max !== null && max >= 40
        ? "critical"
        : max !== null && max >= 35
          ? "watch"
          : "normal";
    return {
      temperature,
      max,
      min: payload.daily?.temperature_2m_min?.[0] ?? null,
      humidity: payload.current?.relative_humidity_2m ?? null,
      wind: payload.current?.wind_speed_10m ?? null,
      rainChance: payload.daily?.precipitation_probability_max?.[0] ?? 0,
      level,
      source: "Open-Meteo",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      temperature: null,
      max: null,
      min: null,
      humidity: null,
      wind: null,
      rainChance: null,
      level: "unknown" as const,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function storeMessageAttachment(
  attachmentData?: string,
  attachmentType?: string
) {
  if (!attachmentData) return {};
  if (!attachmentType)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Attachment type is required",
    });
  const match = attachmentData.match(/^data:([^;]+)(?:;[^,]*)?;base64,(.+)$/);
  const payloadType = match?.[1]?.toLowerCase().split(",")[0];
  if (!match || payloadType !== attachmentType.toLowerCase())
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid attachment payload",
    });
  const buffer = Buffer.from(match[2], "base64");
  try {
    const normalized = await validateChatUpload({
      buffer,
      contentType: attachmentType,
      kind: attachmentType.startsWith("image/") ? "image" : "audio",
    });
    return {
      attachmentData: normalized.buffer,
      attachmentType: normalized.contentType,
      attachmentExpiresAt: new Date(
        Date.now() + CHAT_ATTACHMENT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid attachment";
    if (message.includes("8MB"))
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "Attachments must be under 8MB",
      });
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }
}

async function storeLostFoundPhoto(
  userId: number,
  photoData?: string,
  photoType?: string
) {
  if (!photoData) return undefined;
  if (
    !photoType ||
    !["image/png", "image/jpeg", "image/webp"].includes(photoType)
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "اختر صورة PNG أو JPG أو WebP",
    });
  const match = photoData.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || match[1] !== photoType)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ملف الصورة غير صالح",
    });
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength > 5_000_000)
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
    });
  try {
    const normalized = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize({
        width: 1400,
        height: 1400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    const stored = await storagePut(
      `lost-found/${userId}/${Date.now()}-${randomBytes(4).toString("hex")}.webp`,
      normalized,
      "image/webp"
    );
    return stored.url;
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "تعذر قراءة الصورة، جرّب صورة أخرى",
    });
  }
}

const listingInput = z.object({
  categoryId: z.number().int().positive(),
  titleEn: z.string().trim().min(2).max(180),
  titleAr: z.string().trim().max(180).optional(),
  descriptionEn: z.string().min(20).max(5000),
  descriptionAr: z.string().max(5000).optional(),
  price: z.number().min(0).max(100000000),
  negotiable: z.boolean().default(false),
  exchangeAvailable: z.boolean().default(false),
  location: z.string().min(2).max(120).default("Hurghada"),
  imageData: z.array(z.string().max(7000000)).max(6).optional(),
  imagePath: z.string().max(600).optional(),
});

const priceGuideInput = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  birdAr: z.string().trim().min(2).max(120),
  birdEn: z.string().trim().min(2).max(120),
  range: z.string().trim().min(2).max(80),
  sourceAr: z.string().trim().min(2).max(240),
  sourceEn: z.string().trim().min(2).max(240),
  sourceUrl: z.string().trim().url().max(600),
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  noteAr: z.string().trim().min(2).max(2000),
  noteEn: z.string().trim().min(2).max(2000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts =>
      opts.ctx.user ? publicUser(opts.ctx.user) : null
    ),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          email: z.string().trim().email().max(320),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.toLowerCase();
        if (await getUserByEmail(email))
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        const user = await createLocalUser({
          openId: `local_${randomUUID()}`,
          name: input.name.trim(),
          email,
          passwordHash: await hashPassword(input.password),
        });
        if (!user)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const token = await sdk.signSession(
          {
            openId: user.openId,
            appId: ENV.appId || "local-auth",
            name: user.name || input.name,
          },
          { expiresInMs: 1000 * 60 * 60 * 24 * 365 }
        );
        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return publicUser(user);
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email.toLowerCase());
        if (
          !user?.passwordHash ||
          !(await verifyPassword(input.password, user.passwordHash))
        )
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email or password is incorrect",
          });
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const token = await sdk.signSession(
          {
            openId: user.openId,
            appId: ENV.appId || "local-auth",
            name: user.name || user.email || "Member",
          },
          { expiresInMs: 1000 * 60 * 60 * 24 * 365 }
        );
        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return publicUser(user);
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: router({ list: publicProcedure.query(() => listCategories()) }),
  lostFound: router({
    list: publicProcedure
      .input(z.object({ area: z.string().max(120).optional() }).optional())
      .query(({ input }) => listLostFoundReports(input?.area)),
    create: protectedProcedure
      .input(
        z.object({
          kind: z.enum(["lost", "found"]),
          birdName: z.string().trim().min(2).max(160),
          description: z.string().trim().min(10).max(2000),
          area: z.string().trim().min(2).max(120),
          photoData: z.string().max(7_000_000).optional(),
          photoType: z
            .enum(["image/png", "image/jpeg", "image/webp"])
            .optional(),
          contactNote: z.string().max(240).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const photoUrl = await storeLostFoundPhoto(
          ctx.user.id,
          input.photoData,
          input.photoType
        );
        return createLostFoundReport({
          reporterId: ctx.user.id,
          kind: input.kind,
          birdName: input.birdName,
          description: input.description,
          area: input.area,
          photoUrl,
          contactNote: input.contactNote,
        });
      }),
    resolve: protectedProcedure
      .input(z.object({ reportId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const success = await resolveLostFoundReport(
          ctx.user.id,
          input.reportId
        );
        if (!success)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the person who posted this report can close it",
          });
        return { success: true as const };
      }),
  }),
  prices: router({ list: publicProcedure.query(() => listPriceGuide()) }),
  care: router({
    overview: publicProcedure.query(async () => ({
      month: new Date().getMonth() + 1,
      tips: await listSeasonalCareTips(new Date().getMonth() + 1),
      weather: await getHurghadaWeather(),
    })),
  }),
  listings: router({
    list: publicProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            categoryId: z.number().int().positive().optional(),
            limit: z.number().int().min(1).max(48).default(12),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(({ input }) =>
        listListings({
          search: input?.search,
          categoryId: input?.categoryId,
          limit: input?.limit ?? 12,
          offset: input?.offset ?? 0,
        })
      ),
    byId: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getListingById(input.id)),
    images: publicProcedure
      .input(z.object({ listingId: z.number().int().positive() }))
      .query(({ input }) => listListingImages(input.listingId)),
    mine: protectedProcedure.query(({ ctx }) => listMyListings(ctx.user.id)),
    create: protectedProcedure
      .input(listingInput)
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const imagePaths: string[] = input.imagePath ? [input.imagePath] : [];
        for (
          let index = 0;
          index < (input.imageData || []).length;
          index += 1
        ) {
          const imageData = (input.imageData || [])[index];
          const match = imageData.match(
            /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/
          );
          if (!match)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Use PNG, JPEG, or WebP images",
            });
          const mime = match[1];
          const buffer = Buffer.from(match[2], "base64");
          if (buffer.byteLength > 5_000_000)
            throw new TRPCError({
              code: "PAYLOAD_TOO_LARGE",
              message: "Each image must be under 5MB",
            });
          let normalized: Buffer;
          try {
            const pipeline = sharp(buffer, { failOn: "error" });
            const metadata = await pipeline.metadata();
            if (
              !metadata.width ||
              !metadata.height ||
              metadata.width < 320 ||
              metadata.height < 320
            )
              throw new Error("Image dimensions are too small");
            normalized = await pipeline
              .rotate()
              .resize({
                width: 1800,
                height: 1800,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toBuffer();
          } catch {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Images must be valid and at least 320×320 pixels",
            });
          }
          imagePaths.push(
            (
              await storagePut(
                `listings/${ctx.user.id}/listing-${index}.webp`,
                normalized,
                "image/webp"
              )
            ).url
          );
        }
        const [created] = await db
          .insert(listings)
          .values({
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
        if (created.insertId && imagePaths.length)
          await db
            .insert(listingImages)
            .values(
              imagePaths.map((storagePath, index) => ({
                listingId: Number(created.insertId),
                storagePath,
                isCover: index === 0,
                sortOrder: index,
                altText: input.titleEn,
              }))
            );
        await createNotification(
          ctx.user.id,
          "listing_submitted",
          "Listing submitted",
          "Your listing is in the community review queue.",
          `/listing/${created.insertId}`
        );
        return {
          id: Number(created.insertId),
          status: "pending_review" as const,
        };
      }),
    reorderImages: protectedProcedure
      .input(
        z.object({
          listingId: z.number().int().positive(),
          imageIds: z.array(z.number().int().positive()).max(6),
        })
      )
      .mutation(({ ctx, input }) =>
        reorderListingImages(ctx.user.id, input.listingId, input.imageIds)
      ),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => listFavorites(ctx.user.id)),
    status: protectedProcedure
      .input(z.object({ listingId: z.number().int().positive() }))
      .query(({ ctx, input }) => isFavorite(ctx.user.id, input.listingId)),
    toggle: protectedProcedure
      .input(z.object({ listingId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const existing = await db
          .select({ id: favorites.id })
          .from(favorites)
          .where(
            and(
              eq(favorites.userId, ctx.user.id),
              eq(favorites.listingId, input.listingId)
            )
          )
          .limit(1);
        if (existing[0]) {
          await db.delete(favorites).where(eq(favorites.id, existing[0].id));
          await db
            .update(listings)
            .set({
              favoritesCount: sql`greatest(${listings.favoritesCount} - 1, 0)`,
            })
            .where(eq(listings.id, input.listingId));
          return { favorited: false } as const;
        }
        await db
          .insert(favorites)
          .values({ userId: ctx.user.id, listingId: input.listingId });
        await db
          .update(listings)
          .set({ favoritesCount: sql`${listings.favoritesCount} + 1` })
          .where(eq(listings.id, input.listingId));
        return { favorited: true } as const;
      }),
  }),
  community: router({
    list: publicProcedure.query(() => listCommunityPosts()),
    comments: publicProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .query(({ input }) => listCommunityComments(input.postId)),
    liked: protectedProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .query(({ ctx, input }) => hasCommunityLike(ctx.user.id, input.postId)),
    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        toggleCommunityLike(ctx.user.id, input.postId)
      ),
    comment: protectedProcedure
      .input(
        z.object({
          postId: z.number().int().positive(),
          body: z.string().trim().min(1).max(1000),
        })
      )
      .mutation(({ ctx, input }) =>
        createCommunityComment(ctx.user.id, input.postId, input.body)
      ),
    create: protectedProcedure
      .input(
        z.object({
          category: z.enum([
            "care",
            "nutrition",
            "health",
            "breeding",
            "general",
            "other",
          ]),
          title: z.string().trim().min(4).max(180),
          body: z.string().trim().min(10).max(5000),
          imageData: z.string().max(30_000_000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        let imagePath: string | null = null;
        if (input.imageData) {
          const match = input.imageData.match(
            /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/
          );
          if (!match)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "استخدم صورة JPG أو PNG أو WebP",
            });
          try {
            const buffer = Buffer.from(match[2], "base64");
            if (buffer.length > 20_000_000) throw new Error("large");
            await sharp(buffer, { failOn: "error" }).metadata();
            const normalized = await sharp(buffer)
              .rotate()
              .resize({
                width: 1800,
                height: 1800,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toBuffer();
            imagePath = (
              await storagePut(
                `community/${ctx.user.id}/post-${Date.now()}.webp`,
                normalized,
                "image/webp"
              )
            ).url;
          } catch {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "تعذر قراءة الصورة، جرّب صورة JPG أو PNG عادية",
            });
          }
        }
        const [created] = await db
          .insert(communityPosts)
          .values({
            authorId: ctx.user.id,
            category: input.category,
            title: input.title,
            body: input.body,
            imagePath,
          });
        return { id: Number(created.insertId) };
      }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) =>
      unreadNotificationCount(ctx.user.id)
    ),
    preferences: protectedProcedure.query(({ ctx }) =>
      getNotificationPreferences(ctx.user.id)
    ),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          newMessage: z.boolean(),
          listingUpdates: z.boolean(),
          communityUpdates: z.boolean(),
          customUpdates: z.boolean(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateNotificationPreferences(ctx.user.id, input)
      ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, ctx.user.id)
            )
          );
        return { success: true } as const;
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, ctx.user.id));
      return { success: true } as const;
    }),
  }),
  updates: router({
    list: publicProcedure.query(() => listAppUpdates()),
  }),
  messages: router({
    conversations: protectedProcedure.query(({ ctx }) =>
      listConversations(ctx.user.id)
    ),
    byConversation: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (
          !conversation ||
          (conversation.buyerId !== ctx.user.id &&
            conversation.sellerId !== ctx.user.id)
        )
          throw new TRPCError({ code: "FORBIDDEN" });
        return listMessages(input.conversationId);
      }),
    start: protectedProcedure
      .input(
        z.object({
          listingId: z.number().int().positive(),
          body: z.string().max(3000).default(""),
          ...messageAttachmentInput.shape,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const listing = await getListingSeller(input.listingId);
        if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
        if (listing.sellerId === ctx.user.id)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot message yourself",
          });
        if (!input.body.trim() && !input.attachmentData)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Write a message or attach a file",
          });
        const attachment = await storeMessageAttachment(
          input.attachmentData,
          input.attachmentType
        );
        const conversation = await createConversationMessage({
          listingId: input.listingId,
          buyerId: ctx.user.id,
          sellerId: listing.sellerId,
          body: input.body,
          ...attachment,
        });
        return { conversationId: conversation.id };
      }),
    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number().int().positive(),
          body: z.string().max(3000).default(""),
          ...messageAttachmentInput.shape,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (
          !conversation ||
          (conversation.buyerId !== ctx.user.id &&
            conversation.sellerId !== ctx.user.id)
        )
          throw new TRPCError({ code: "FORBIDDEN" });
        if (!input.body.trim() && !input.attachmentData)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Write a message or attach a file",
          });
        const attachment = await storeMessageAttachment(
          input.attachmentData,
          input.attachmentType
        );
        return addMessage(
          input.conversationId,
          ctx.user.id,
          input.body,
          attachment.attachmentData,
          attachment.attachmentType,
          attachment.attachmentExpiresAt
        );
      }),
  }),
  reports: router({
    create: protectedProcedure
      .input(
        z.object({
          targetType: z.enum(["listing", "user", "post", "conversation"]),
          targetId: z.number().int().positive(),
          reason: z.string().min(5).max(180),
        })
      )
      .mutation(({ ctx, input }) =>
        createReport({ reporterId: ctx.user.id, ...input })
      ),
  }),
  reviews: router({
    create: protectedProcedure
      .input(
        z.object({
          sellerId: z.number().int().positive(),
          listingId: z.number().int().positive(),
          rating: z.number().int().min(1).max(5),
          body: z.string().min(10).max(1200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.sellerId)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot review yourself",
          });
        if (
          !(await canReviewCompletedListing(
            ctx.user.id,
            input.sellerId,
            input.listingId
          ))
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Reviews unlock after a completed transaction",
          });
        return createReview({ reviewerId: ctx.user.id, ...input });
      }),
  }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120),
          phone: z.string().max(32).optional(),
          area: z.string().max(120).optional(),
          bio: z.string().max(600).optional(),
          whatsappOptIn: z.boolean(),
        })
      )
      .mutation(({ ctx, input }) => updateProfile(ctx.user.id, input)),
    requestContactVerification: protectedProcedure
      .input(z.object({ phone: z.string().min(7).max(32) }))
      .mutation(({ ctx, input }) =>
        requestContactVerification(ctx.user.id, input.phone)
      ),
  }),
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),
    users: adminProcedure
      .input(
        z
          .object({ limit: z.number().int().min(1).max(200).default(200) })
          .optional()
      )
      .query(({ input }) => listAdminUsers(input?.limit ?? 200)),
    updateUser: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          name: z.string().trim().min(2).max(120),
          phone: z.string().max(32).optional(),
          area: z.string().max(120).optional(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(({ ctx, input }) => updateAdminUser(ctx.user.id, input)),
    priceGuide: adminProcedure.query(() => listPriceGuide()),
    priceDrafts: adminProcedure.query(() => listPendingPriceGuideDrafts()),
    approvePriceDraft: adminProcedure
      .input(z.object({ draftId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        approvePriceGuideDraft(ctx.user.id, input.draftId)
      ),
    rejectPriceDraft: adminProcedure
      .input(
        z.object({
          draftId: z.number().int().positive(),
          reason: z.string().max(500).default(""),
        })
      )
      .mutation(({ ctx, input }) =>
        rejectPriceGuideDraft(ctx.user.id, input.draftId, input.reason)
      ),
    createPriceGuideItem: adminProcedure
      .input(priceGuideInput)
      .mutation(({ ctx, input }) => createPriceGuideItem(ctx.user.id, input)),
    updatePriceGuideItem: adminProcedure
      .input(priceGuideInput)
      .mutation(({ ctx, input }) => updatePriceGuideItem(ctx.user.id, input)),
    deletePriceGuideItem: adminProcedure
      .input(
        z.object({
          id: z
            .string()
            .trim()
            .min(2)
            .max(80)
            .regex(/^[a-z0-9-]+$/),
        })
      )
      .mutation(({ ctx, input }) =>
        deletePriceGuideItem(ctx.user.id, input.id)
      ),
    messageAttachments: adminProcedure
      .input(
        z
          .object({ limit: z.number().int().min(1).max(200).default(100) })
          .optional()
      )
      .query(({ input }) => listMessageAttachments(input?.limit ?? 100)),
    pendingListings: adminProcedure.query(() => listPendingListings()),
    moderationPosts: adminProcedure.query(() => listModerationPosts()),
    sendCustomNotification: adminProcedure
      .input(
        z.object({
          recipientId: z.number().int().positive().optional(),
          title: z.string().min(3).max(180),
          body: z.string().min(5).max(1000),
          link: z.string().max(240).optional(),
        })
      )
      .mutation(async ({ input }) => ({
        delivered: await createCustomNotifications(input),
      })),
    publishUpdate: adminProcedure
      .input(
        z.object({
          version: z.string().min(1).max(40),
          titleEn: z.string().min(3).max(180),
          titleAr: z.string().min(3).max(180),
          bodyEn: z.string().min(5).max(3000),
          bodyAr: z.string().min(5).max(3000),
          link: z.string().max(240).optional(),
        })
      )
      .mutation(({ input }) => publishAppUpdate(input)),
    moderateListing: adminProcedure
      .input(
        z.object({
          listingId: z.number().int().positive(),
          decision: z.enum(["approved", "rejected"]),
        })
      )
      .mutation(({ ctx, input }) =>
        moderateListing(input.listingId, ctx.user.id, input.decision)
      ),
    openReports: adminProcedure.query(() => listOpenReports()),
    resolveReport: adminProcedure
      .input(
        z.object({
          reportId: z.number().int().positive(),
          status: z.enum(["resolved", "dismissed"]),
          resolution: z.string().min(3).max(500),
        })
      )
      .mutation(({ ctx, input }) =>
        resolveReport(
          input.reportId,
          ctx.user.id,
          input.status,
          input.resolution
        )
      ),
    moderatePost: adminProcedure
      .input(
        z.object({
          postId: z.number().int().positive(),
          status: z.enum(["published", "hidden", "locked"]),
        })
      )
      .mutation(({ ctx, input }) =>
        moderateCommunityPost(input.postId, ctx.user.id, input.status)
      ),
  }),
});

export type AppRouter = typeof appRouter;
