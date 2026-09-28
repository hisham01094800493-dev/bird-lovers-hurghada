import { z } from "zod";

export const listingTextFields = {
  titleEn: z.string().trim().max(180).optional(),
  titleAr: z.string().trim().max(180).optional(),
  descriptionEn: z.string().trim().max(5000).optional(),
  descriptionAr: z.string().trim().max(5000).optional(),
};

export function validateListingText(
  input: {
    titleEn?: string;
    titleAr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
  },
  context: z.RefinementCtx,
) {
  const englishComplete =
    (input.titleEn?.trim().length || 0) >= 4 &&
    (input.descriptionEn?.trim().length || 0) >= 20;
  const arabicComplete =
    (input.titleAr?.trim().length || 0) >= 4 &&
    (input.descriptionAr?.trim().length || 0) >= 20;

  if (!englishComplete && !arabicComplete) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["titleAr"],
      message:
        "أدخل عنوانًا من 4 أحرف ووصفًا من 20 حرفًا على الأقل بالعربية أو الإنجليزية",
    });
  }
}

export const listingTextSchema = z
  .object(listingTextFields)
  .superRefine(validateListingText);

export const listingEditSchema = z
  .object({
    ...listingTextFields,
    price: z.coerce.number().positive().max(100_000_000),
    location: z.string().trim().min(2).max(120).default("Hurghada"),
    imageData: z.array(z.string().max(7_000_000)).max(6).optional(),
    coverImageId: z.coerce.number().int().positive().optional(),
  })
  .superRefine(validateListingText);

export function canonicalizeListingText(input: {
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}) {
  const titleEn = input.titleEn?.trim() || input.titleAr?.trim() || "";
  const titleAr = input.titleAr?.trim() || input.titleEn?.trim() || "";
  const descriptionEn =
    input.descriptionEn?.trim() || input.descriptionAr?.trim() || "";
  const descriptionAr =
    input.descriptionAr?.trim() || input.descriptionEn?.trim() || "";

  return { titleEn, titleAr, descriptionEn, descriptionAr };
}
