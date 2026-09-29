const ARABIC_MARKS = /[\u064B-\u065F\u0670\u0640]/g;

export function normalizeArabicSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(ARABIC_MARKS, "")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ar");
}
