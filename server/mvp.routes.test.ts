import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MVP protected routes", () => {
  it("requires authentication to create a listing", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.listings.create({
      categoryId: 1,
      titleEn: "A friendly bird",
      descriptionEn: "A friendly bird looking for a calm home.",
      price: 100,
      negotiable: false,
      exchangeAvailable: false,
      location: "Hurghada",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to toggle a favorite", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.favorites.toggle({ listingId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to publish a community post", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.community.create({ category: "care", title: "A useful care tip", body: "Keep fresh water available every day." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
