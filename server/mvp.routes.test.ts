import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function createUserContext(email = "member@example.com"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 22, openId: "member", email, name: "Member", loginMethod: "manus", role: "user", avatarUrl: null, phone: null, area: null, bio: null, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MVP protected routes", () => {
  it("requires authentication to create a listing", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.listings.create({ categoryId: 1, titleEn: "A friendly bird", descriptionEn: "A friendly bird looking for a calm home.", price: 100, negotiable: false, exchangeAvailable: false, location: "Hurghada" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to toggle a favorite", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.favorites.toggle({ listingId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to publish a community post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.community.create({ category: "care", title: "A useful care tip", body: "Keep fresh water available every day." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects the admin console server-side", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects conversations and notifications server-side", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.messages.conversations()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notifications.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("recognizes the designated administrator identity", async () => {
    const caller = appRouter.createCaller(createUserContext("h201065303382@gmail.com"));
    await expect(caller.admin.stats()).resolves.toBeDefined();
  });
});
