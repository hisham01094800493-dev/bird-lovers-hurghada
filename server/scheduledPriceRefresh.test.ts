import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  createPriceGuideDraft: vi.fn(),
  collectExternalPriceDraft: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({ createPriceGuideDraft: mocks.createPriceGuideDraft }));
vi.mock("./priceRefresh", () => ({ collectExternalPriceDraft: mocks.collectExternalPriceDraft }));

import { scheduledPriceRefresh } from "./scheduledPriceRefresh";

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (body: unknown) => MockResponse;
};

function response(): MockResponse {
  const output: MockResponse = {
    statusCode: 200,
    body: undefined,
    status(code) {
      output.statusCode = code;
      return output;
    },
    json(body) {
      output.body = body;
      return output;
    },
  };
  return output;
}

function request(secret: string, runNow = false) {
  return {
    originalUrl: "/api/scheduled/price-guide-refresh",
    header(name: string) {
      if (name === "x-price-refresh-secret") return secret;
      if (name === "x-price-refresh-run-now") return runNow ? "true" : "false";
      return undefined;
    },
  } as never;
}

describe("scheduledPriceRefresh", () => {
  const previousSecret = process.env.PRICE_REFRESH_SECRET;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T21:00:00Z"));
    process.env.PRICE_REFRESH_SECRET = "test-secret";
    mocks.authenticateRequest.mockReset();
    mocks.createPriceGuideDraft.mockReset().mockResolvedValue(71);
    mocks.collectExternalPriceDraft.mockReset().mockResolvedValue({
      items: [{ id: "budgie", range: "100–200 ج.م" }],
      sourceSummary: "test",
      sourceUrl: "https://example.com",
      collectedOn: "2026-09-23",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (previousSecret === undefined) delete process.env.PRICE_REFRESH_SECRET;
    else process.env.PRICE_REFRESH_SECRET = previousSecret;
  });

  it("accepts the configured secret and skips safely outside the Wednesday window", async () => {
    const res = response();
    await scheduledPriceRefresh(request("test-secret"), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, skipped: "outside-Wednesday-1am-Cairo-window" });
    expect(mocks.authenticateRequest).not.toHaveBeenCalled();
    expect(mocks.createPriceGuideDraft).not.toHaveBeenCalled();
  });

  it("allows run-now only when the configured secret is present and correct", async () => {
    const res = response();
    await scheduledPriceRefresh(request("test-secret", true), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, draftId: 71, itemCount: 1, manual: true });
    expect(mocks.authenticateRequest).not.toHaveBeenCalled();
    expect(mocks.collectExternalPriceDraft).toHaveBeenCalledOnce();
    expect(mocks.createPriceGuideDraft).toHaveBeenCalledOnce();
  });
});
