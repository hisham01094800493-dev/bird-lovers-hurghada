export type PriceReference = {
  id: string;
  birdAr: string;
  birdEn: string;
  range: string;
  sourceAr: string;
  sourceEn: string;
  sourceUrl: string;
  checkedOn: string;
  noteAr: string;
  noteEn: string;
};

// These are indicative ranges, not official market quotes. Review before publishing a new weekly snapshot.
export const PRICE_GUIDE_LAST_UPDATED = "2026-09-23";
export const PRICE_GUIDE_SOURCES = [
  { labelAr: "تقرير عن سوق السيدة عائشة – اليوم السابع", labelEn: "Al Youm Al Sabea report on Sayeda Aisha market", url: "https://www.youm7.com/story/2026/8/7/سوق-السيدة-عائشة-جنة-طيور-الزينة-فى-مصر/7504918" },
  { labelAr: "إعلانات طيور منشورة للمقارنة", labelEn: "Public bird listings used for comparison", url: "https://4sw.app/category/7/69/birds-and-pigeons" },
];

export const PRICE_REFERENCES: PriceReference[] = [
  { id: "budgie", birdAr: "بادجي", birdEn: "Budgerigar", range: "90–350 ج.م", sourceAr: "مؤشر إعلانات ومتابعة سوقية", sourceEn: "Listings and market-watch indicator", sourceUrl: PRICE_GUIDE_SOURCES[1].url, checkedOn: PRICE_GUIDE_LAST_UPDATED, noteAr: "يتغير حسب اللون والعمر والتدريب", noteEn: "Varies by colour, age, and training" },
  { id: "cockatiel", birdAr: "كوكتيل", birdEn: "Cockatiel", range: "300–1,200 ج.م", sourceAr: "مؤشر إعلانات ومتابعة سوقية", sourceEn: "Listings and market-watch indicator", sourceUrl: PRICE_GUIDE_SOURCES[1].url, checkedOn: PRICE_GUIDE_LAST_UPDATED, noteAr: "الطفرة والترويض يؤثران بشدة على السعر", noteEn: "Mutation and tameness strongly affect price" },
  { id: "lovebird", birdAr: "روز / فيشر", birdEn: "Lovebird", range: "250–900 ج.م", sourceAr: "مؤشر إعلانات ومتابعة سوقية", sourceEn: "Listings and market-watch indicator", sourceUrl: PRICE_GUIDE_SOURCES[1].url, checkedOn: PRICE_GUIDE_LAST_UPDATED, noteAr: "السعر للزوج أو للطائر حسب الإعلان", noteEn: "Price may be per bird or pair" },
  { id: "zebra", birdAr: "زيبرا", birdEn: "Zebra finch", range: "80–300 ج.م", sourceAr: "مؤشر إعلانات ومتابعة سوقية", sourceEn: "Listings and market-watch indicator", sourceUrl: PRICE_GUIDE_SOURCES[1].url, checkedOn: PRICE_GUIDE_LAST_UPDATED, noteAr: "يفضل التأكد من العدد والحالة قبل المقارنة", noteEn: "Confirm quantity and condition before comparing" },
];
