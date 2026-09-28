import { describe, expect, it } from "vitest";
import {
  canonicalizeListingText,
  listingEditSchema,
  listingTextSchema,
} from "../shared/listingValidation";

describe("single-language listing content", () => {
  it("accepts Arabic-only title and description", () => {
    expect(
      listingTextSchema.safeParse({
        titleAr: "بادجي أليف",
        descriptionAr: "طائر أليف وهادئ يبحث عن بيت مناسب.",
      }).success,
    ).toBe(true);
  });

  it("accepts English-only title and description", () => {
    expect(
      listingTextSchema.safeParse({
        titleEn: "Friendly budgie",
        descriptionEn: "A calm companion bird looking for a caring home.",
      }).success,
    ).toBe(true);
  });

  it("requires a complete title and description in at least one language", () => {
    expect(listingTextSchema.safeParse({}).success).toBe(false);
    expect(
      listingTextSchema.safeParse({
        titleAr: "طيور جميلة",
        descriptionEn: "A friendly bird looking for a caring home.",
      }).success,
    ).toBe(false);
    expect(
      listingTextSchema.safeParse({
        titleAr: "باد",
        descriptionAr: "طائر أليف وهادئ يبحث عن بيت مناسب.",
      }).success,
    ).toBe(false);
  });

  it("fills legacy required database columns from the entered language", () => {
    expect(
      canonicalizeListingText({
        titleAr: "بادجي أليف",
        descriptionAr: "طائر أليف وهادئ يبحث عن بيت مناسب.",
      }),
    ).toEqual({
      titleEn: "بادجي أليف",
      titleAr: "بادجي أليف",
      descriptionEn: "طائر أليف وهادئ يبحث عن بيت مناسب.",
      descriptionAr: "طائر أليف وهادئ يبحث عن بيت مناسب.",
    });
  });

  it("requires a positive numeric price when editing", () => {
    const listing = {
      titleAr: "بادجي أليف",
      descriptionAr: "طائر أليف وهادئ يبحث عن بيت مناسب.",
      price: "125.50",
      location: "Hurghada",
    };
    expect(listingEditSchema.safeParse(listing).success).toBe(true);
    expect(
      listingEditSchema.safeParse({ ...listing, price: "0" }).success,
    ).toBe(false);
    expect(
      listingEditSchema.safeParse({ ...listing, price: "not a price" }).success,
    ).toBe(false);
  });
});
