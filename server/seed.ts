import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { categories, communityPosts, listingImages, listings, users } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  await db.insert(users).values({ openId: "seed-seller-1", name: "Mina Hassan", email: "mina@birdlovers.local", loginMethod: "seed", area: "El Kawther", bio: "Small flock, big care.", role: "user" }).onDuplicateKeyUpdate({ set: { name: "Mina Hassan", area: "El Kawther" } });
  await db.insert(users).values({ openId: "seed-seller-2", name: "Nour Adel", email: "nour@birdlovers.local", loginMethod: "seed", area: "Sheraton", bio: "Birds, cages and patient advice.", role: "user" }).onDuplicateKeyUpdate({ set: { name: "Nour Adel", area: "Sheraton" } });
  const seedUsers = await db.select({ id: users.id, openId: users.openId }).from(users).where(eq(users.loginMethod, "seed"));
  const mina = seedUsers.find(user => user.openId === "seed-seller-1")?.id;
  const nour = seedUsers.find(user => user.openId === "seed-seller-2")?.id;
  if (!mina || !nour) throw new Error("Seed users were not created");

  const categoryRows = [
    { slug: "birds", nameEn: "Birds", nameAr: "طيور", icon: "bird", accent: "mint" },
    { slug: "pets", nameEn: "Small pets", nameAr: "حيوانات أليفة", icon: "paw", accent: "sand" },
    { slug: "cages", nameEn: "Cages", nameAr: "أقفاص", icon: "home", accent: "sky" },
    { slug: "food", nameEn: "Food", nameAr: "غذاء", icon: "wheat", accent: "sand" },
    { slug: "accessories", nameEn: "Accessories", nameAr: "مستلزمات", icon: "feather", accent: "coral" },
    { slug: "other", nameEn: "Other", nameAr: "أخرى", icon: "sparkles", accent: "mint" },
  ];
  for (const category of categoryRows) await db.insert(categories).values(category).onDuplicateKeyUpdate({ set: { nameEn: category.nameEn, nameAr: category.nameAr, accent: category.accent } });
  const categoryRowsDb = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const category = (slug: string) => categoryRowsDb.find(row => row.slug === slug)!.id;

  const items = [
    { sellerId: mina, categoryId: category("birds"), titleEn: "Colourful lorikeet looking for a calm home", titleAr: "لوريكيت ملون يبحث عن بيت هادئ", descriptionEn: "Friendly, curious and used to people. Comes with a starter food pack and a little care guide.", descriptionAr: "ودود وفضولي ومتعود على الناس.", price: "2800.00", negotiable: true, exchangeAvailable: false, location: "El Kawther", image: "/manus-storage/rainbow-lorikeet_6273d539.jpg" },
    { sellerId: nour, categoryId: category("cages"), titleEn: "Classic brass cage with stand", titleAr: "قفص نحاسي كلاسيكي مع حامل", descriptionEn: "Good condition and easy to clean. Suitable for a small to medium bird.", descriptionAr: "حالة جيدة وسهل التنظيف.", price: "1450.00", negotiable: true, exchangeAvailable: false, location: "Sheraton", image: "/manus-storage/cage-classic_a82669de.jpg" },
    { sellerId: mina, categoryId: category("birds"), titleEn: "Hand-tamed green parakeet", titleAr: "بادجي أخضر أليف", descriptionEn: "Gentle and hand-tamed. Looking for someone who has time for daily interaction and care.", descriptionAr: "أليف ومتعود على اليد.", price: "950.00", negotiable: false, exchangeAvailable: true, location: "Dahar", image: "/manus-storage/green-budgerigar_f47e1082.jpg" },
    { sellerId: nour, categoryId: category("birds"), titleEn: "Blue & gold macaw — experienced home only", titleAr: "مكاو أزرق وذهبي — لبيت لديه خبرة", descriptionEn: "A beautiful bird with a big personality. Please reach out only if you have prior experience with larger parrots.", descriptionAr: "طائر جميل ويحتاج إلى بيت لديه خبرة.", price: "18500.00", negotiable: true, exchangeAvailable: false, location: "El Mamsha", image: "/manus-storage/blue-gold-macaw_e9110acc.jpg" },
    { sellerId: mina, categoryId: category("birds"), titleEn: "Friendly cockatiel ready for a loving home", titleAr: "كوكتيل أليف يبحث عن بيت محب", descriptionEn: "A cheerful, gentle cockatiel that enjoys company and daily attention. A lovely starter bird for a caring family.", descriptionAr: "كوكتيل هادئ وأليف ويحب الصحبة والاهتمام اليومي، مناسب لعائلة محبة للطيور.", price: "2200.00", negotiable: true, exchangeAvailable: false, location: "El Kawther", image: "/manus-storage/cockatiel_b7203d6a.jpg" },
    { sellerId: nour, categoryId: category("food"), titleEn: "Starter food bundle for small birds", titleAr: "باقة غذاء بداية للطيور الصغيرة", descriptionEn: "A practical starter bundle with seeds and treats for budgies and cockatiels. Easy to collect in Hurghada.", descriptionAr: "باقة عملية من الحبوب والمكافآت للبادجي والكوكتيل، والاستلام داخل الغردقة.", price: "350.00", negotiable: false, exchangeAvailable: false, location: "Sheraton", image: "/manus-storage/cage-classic_a82669de.jpg" },
  ];
  for (const item of items) {
    const existing = await db.select({ id: listings.id }).from(listings).where(eq(listings.titleEn, item.titleEn)).limit(1);
    if (existing.length > 0) continue;
    const { image, ...listingValues } = item;
    const [created] = await db.insert(listings).values({ ...listingValues, status: "published", moderationStatus: "approved" }).then(result => result as any);
    const listingId = Number(created.insertId);
    await db.insert(listingImages).values({ listingId, storagePath: image, altText: item.titleEn, isCover: true });
  }

  const existingPosts = await db.select({ id: communityPosts.id }).from(communityPosts).limit(1);
  if (existingPosts.length === 0) {
    await db.insert(communityPosts).values([
      { authorId: mina, category: "care", title: "How do you help a new bird settle in?", body: "Bringing home a new bird this weekend. What helped your bird feel safe during the first few days?", likesCount: 12, commentsCount: 4 },
      { authorId: nour, category: "nutrition", title: "A small reminder about fresh water", body: "Fresh water matters more than fancy treats. In the heat, I change the bowl twice a day and keep it away from direct sun.", likesCount: 18, commentsCount: 6 },
    ]);
  }
  console.log("Seed complete");
  process.exit(0);
}

seed().catch(error => { console.error(error); process.exit(1); });
