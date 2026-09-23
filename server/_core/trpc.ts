import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (ctx.user.role !== "admin" && ctx.user.accountStatus === "banned") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذا الحساب محظور من استخدام المنصة",
    });
  }
  if (
    ctx.user.role !== "admin" &&
    ctx.user.accountStatus === "suspended" &&
    ctx.user.suspendedUntil &&
    ctx.user.suspendedUntil > new Date()
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `هذا الحساب موقوف مؤقتًا حتى ${ctx.user.suspendedUntil.toLocaleDateString("ar-EG")}`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
