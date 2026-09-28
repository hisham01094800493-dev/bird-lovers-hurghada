import { describe, expect, it } from "vitest";
import { normalizeArabicSearch } from "./arabicText";

describe("normalizeArabicSearch", () => {
  it("folds ta marbuta/ha and alef maqsura/ya", () => {
    expect(normalizeArabicSearch("المدرسة هدى")).toBe("المدرسه هدي");
  });

  it("removes diacritics and tatweel while normalizing spacing", () => {
    expect(normalizeArabicSearch("مُــــكَوِّن   الطُّيُور")).toBe(
      "مكون الطيور",
    );
  });
});
