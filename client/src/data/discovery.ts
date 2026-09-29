export type DirectoryEntry = {
  id: string;
  kind: "clinic" | "shop";
  nameEn: string;
  nameAr: string;
  phone: string;
  addressEn: string;
  addressAr: string;
  mapQuery: string;
  sourceUrl: string;
  noteEn: string;
  noteAr: string;
};

/**
 * Public starter entries. Phone numbers and addresses should be re-confirmed
 * with each business before we mark an entry as verified.
 */
export const DIRECTORY_ENTRIES: DirectoryEntry[] = [
  {
    id: "top-vets-hurghada",
    kind: "clinic",
    nameEn: "Top Vets Hurghada Animal Clinic",
    nameAr: "توب فيتس لعيادة الحيوانات بالغردقة",
    phone: "+20 127 638 0398",
    addressEn: "Hurghada, Red Sea Governorate",
    addressAr: "الغردقة، محافظة البحر الأحمر",
    mapQuery: "Top Vets Hurghada Animal Clinic",
    sourceUrl:
      "https://www.facebook.com/ElGounaStars/photos/please-sharehi-all-in-light-of-the-past-few-days-we-thought-wed-compile-a-list-o/5726472137382830/",
    noteEn: "Call ahead and ask whether an avian appointment is available.",
    noteAr: "اتصل أولًا واسأل عن توافر موعد متخصص للطيور.",
  },
  {
    id: "blue-moon-animal-clinic",
    kind: "clinic",
    nameEn: "Blue Moon Animal Clinic Hurghada",
    nameAr: "عيادة بلو مون للحيوانات بالغردقة",
    phone: "+20 109 939 0101",
    addressEn: "Hurghada, Red Sea Governorate",
    addressAr: "الغردقة، محافظة البحر الأحمر",
    mapQuery: "Blue Moon Animal Clinic Hurghada",
    sourceUrl:
      "https://www.facebook.com/ElGounaStars/photos/please-sharehi-all-in-light-of-the-past-few-days-we-thought-wed-compile-a-list-o/5726472137382830/",
    noteEn: "Confirm opening hours and bird-care availability by phone.",
    noteAr: "تأكد من مواعيد العمل وتوافر رعاية الطيور عبر الهاتف.",
  },
  {
    id: "pet-center-hurghada",
    kind: "shop",
    nameEn: "Pet Center Hurghada",
    nameAr: "Pet Center الغردقة",
    phone: "+20 10 0803 3585",
    addressEn: "142 Metro Street, Old Kawser, Hurghada",
    addressAr: "142 شارع مترو، منطقة الكوثر القديمة، الغردقة",
    mapQuery: "Pet Center 142 Metro Street Old Kawser Hurghada",
    sourceUrl: "https://www.facebook.com/p/Pet-Center-100064282441644/",
    noteEn: "Pet supplies, food, delivery and in-store pickup are listed publicly.",
    noteAr: "مستلزمات وأغذية للحيوانات مع توصيل واستلام من المتجر حسب الصفحة العامة.",
  },
  {
    id: "amy-pet-store",
    kind: "shop",
    nameEn: "Amy Pet Store",
    nameAr: "Amy Pet Store",
    phone: "+20 120 002 1906",
    addressEn: "El Kawser, Metro Market Street, next to Etisalat branch",
    addressAr: "الكوثر، شارع مترو ماركت، بجوار فرع اتصالات",
    mapQuery: "Amy Pet Store El Kawser Hurghada",
    sourceUrl: "https://www.instagram.com/amypetstore1/",
    noteEn: "Ask the shop about current bird food and accessories stock.",
    noteAr: "اسأل المتجر عن توافر أغذية الطيور والمستلزمات حاليًا.",
  },
];

export type RecommendedProduct = {
  id: string;
  category: "food" | "care" | "housing";
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceEn: string;
  priceAr: string;
  image: string;
  buyUrl: string;
  noonUrl: string;
  noonCoupon: string;
  tagEn: string;
  tagAr: string;
};

/** Replace buyUrl values with the approved affiliate links before launch. */
export const RECOMMENDED_PRODUCTS: RecommendedProduct[] = [
  {
    id: "balanced-seed-mix",
    category: "food",
    nameEn: "Balanced seed mix",
    nameAr: "خلطة بذور متوازنة",
    descriptionEn: "A practical everyday starting point for small companion birds.",
    descriptionAr: "اختيار عملي كبداية للتغذية اليومية للطيور الصغيرة.",
    priceEn: "Check current price",
    priceAr: "تحقق من السعر الحالي",
    image: "/images/bird-seed.jpg",
    buyUrl: "https://www.amazon.eg/s?k=bird+seed+mix",
    noonUrl: "",
    noonCoupon: "",
    tagEn: "Everyday care",
    tagAr: "رعاية يومية",
  },
  {
    id: "natural-perch",
    category: "care",
    nameEn: "Natural wood perch",
    nameAr: "مجثم خشبي طبيعي",
    descriptionEn: "A simple enrichment upgrade that gives feet different textures.",
    descriptionAr: "إضافة بسيطة للتنويع تمنح أقدام الطائر أسطحًا مختلفة.",
    priceEn: "Check current price",
    priceAr: "تحقق من السعر الحالي",
    image: "/images/cage-gold.jpg",
    buyUrl: "https://www.amazon.eg/s?k=natural+wood+bird+perch",
    noonUrl: "",
    noonCoupon: "",
    tagEn: "Enrichment",
    tagAr: "تنويع ونشاط",
  },
  {
    id: "travel-carrier",
    category: "housing",
    nameEn: "Small bird travel carrier",
    nameAr: "حقيبة نقل للطيور الصغيرة",
    descriptionEn: "Useful for safe clinic visits and short trips around Hurghada.",
    descriptionAr: "مفيدة للذهاب إلى العيادة والتنقلات القصيرة بأمان.",
    priceEn: "Check current price",
    priceAr: "تحقق من السعر الحالي",
    image: "/images/cage-gold.jpg",
    buyUrl: "https://www.amazon.eg/s?k=small+bird+travel+carrier",
    noonUrl: "",
    noonCoupon: "",
    tagEn: "Safe transport",
    tagAr: "نقل آمن",
  },
];
