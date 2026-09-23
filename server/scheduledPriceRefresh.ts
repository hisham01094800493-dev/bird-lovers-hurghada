import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { createPriceGuideDraft } from "./db";
import { collectExternalPriceDraft } from "./priceRefresh";

export async function scheduledPriceRefresh(req: Request, res: Response) {
  const context = { url: req.originalUrl, taskUid: "unknown" };
  try {
    const user = await sdk.authenticateRequest(req);
    context.taskUid = user?.taskUid || "unknown";
    if (!user?.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const now = new Date();
    const cairoParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", hour12: false }).formatToParts(now);
    const cairoWeekday = cairoParts.find(part => part.type === "weekday")?.value;
    const cairoHour = Number(cairoParts.find(part => part.type === "hour")?.value || "-1");
    if (cairoWeekday !== "Fri" || cairoHour !== 17) return res.json({ ok: true, skipped: "outside-Friday-5pm-Cairo-window" });
    const today = now.toISOString().slice(0, 10);
    const draft = await collectExternalPriceDraft(today);
    const id = await createPriceGuideDraft(draft);
    return res.json({ ok: true, draftId: id, itemCount: draft.items.length, collectedOn: today });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context, timestamp: new Date().toISOString() });
  }
}
