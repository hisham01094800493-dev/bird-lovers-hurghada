import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function member(email = "member@example.com"): NonNullable<TrpcContext["user"]> {
  const now = new Date();
  return { id: 42, openId: "notification-member", email, name: "Notification Member", loginMethod: "manus", role: "user", avatarUrl: null, phone: null, whatsappOptIn: false, phoneVerifiedAt: null, area: null, bio: null, createdAt: now, updatedAt: now, lastSignedIn: now };
}

describe("custom notifications", () => {
  it("requires authentication for preferences", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.notifications.preferences()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notifications.updatePreferences({ newMessage: true, listingUpdates: true, communityUpdates: true, customUpdates: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps custom broadcast restricted to administrators", async () => {
    const caller = appRouter.createCaller(context(member()));
    await expect(caller.admin.sendCustomNotification({ title: "A useful update", body: "Please check the new community guide." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.publishUpdate({ version: "1.2.0", titleEn: "New feature", titleAr: "ميزة جديدة", bodyEn: "A useful feature is now available.", bodyAr: "أصبحت هناك ميزة جديدة متاحة." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
