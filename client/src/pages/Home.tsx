import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Bird,
  ChevronLeft,
  ChevronRight,
  Heart,
  House,
  MessageCircle,
  Package,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";
import ListingCard from "@/components/ListingCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { DIRECTORY_ENTRIES, RECOMMENDED_PRODUCTS } from "@/data/discovery";

const categoryIcons = {
  birds: Bird,
  pets: PawPrint,
  cages: House,
  food: Wheat,
  accessories: Package,
  other: Sparkles,
} as const;
export default function Home() {
  const { isArabic, t } = useLanguage();
  const categories = trpc.categories.list.useQuery();
  const listings = trpc.listings.list.useQuery({ limit: 6, offset: 0 });
  const posts = trpc.community.list.useQuery();
  return (
    <SiteShell>
      <section className="shell hero-section home-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow flex items-center gap-2">
              <span className="eyebrow-dot" />{" "}
              {isArabic
                ? "مجتمع الطيور في الغردقة"
                : "Hurghada's bird community"}
            </div>
            <h1 className="hero-title">
              {isArabic ? (
                <>
                  بيت أفضل لـ
                  <br />
                  <span className="hero-accent">طيور جميلة</span> وناس طيبين.
                </>
              ) : (
                <>
                  A better home for
                  <br />
                  <span className="hero-accent">good birds</span> & good people.
                </>
              )}
            </h1>
            <p className="hero-lede">
              {isArabic
                ? "اعثر على طيرك المفضل، وتبادل بثقة، وتعلم من جيران يهتمون مثلك."
                : "Find a feathered friend, trade with confidence, and learn from neighbours who care as much as you do."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Link href="/marketplace">
                <Button className="cta-primary h-full">
                  {t("explore")} <ArrowRight size={17} />
                </Button>
              </Link>
              <Link href="/community" className="community-quick-card group">
                <span className="community-quick-icon">
                  <Users size={19} />
                </span>
                <span className="min-w-0 text-right">
                  <strong>
                    {isArabic
                      ? "دليل المبتدئ ومجتمع الهواة"
                      : "Beginner guide & bird community"}
                  </strong>
                  <small>
                    {isArabic
                      ? "اسأل عن الرعاية والتغذية قبل ما تشتري"
                      : "Ask about care and feeding before you buy"}
                  </small>
                </span>
                <ArrowRight size={17} className="community-quick-arrow" />
              </Link>
              <Link href="/sell">
                <Button variant="outline" className="cta-secondary h-full">
                  {t("listSell")} <Sparkles size={16} />
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-medium text-[#6d8580]">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-[#76a68f]" />{" "}
                {isArabic ? "مراجعة مجتمعية" : "Community-reviewed"}
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck size={17} className="text-[#76a68f]" />{" "}
                {isArabic ? "للغردقة أولًا" : "Hurghada-first"}
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={17} className="text-[#d26246]" />{" "}
                {isArabic ? "محادثات حقيقية" : "Real conversations"}
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orb" />
            <div className="hero-photo-main">
              <img
                src="/images/hurghada-parrot-hero.jpg"
                alt={isArabic ? "ببغاء ملون" : "Colourful parrot"}
              />
            </div>
            <div className="hero-photo-small">
              <img
                src="/images/hurghada-budgie-card.jpg"
                alt={isArabic ? "طائران ملونان" : "Two colourful budgies"}
              />
            </div>
            <div className="hero-note">
              <span className="note-icon">
                <Heart size={15} fill="currentColor" />
              </span>
              <span>
                <strong>
                  {isArabic ? "12 إعلانًا جديدًا" : "12 new listings"}
                </strong>
                <small>
                  {isArabic
                    ? "هذا الأسبوع في الغردقة"
                    : "this week in Hurghada"}
                </small>
              </span>
            </div>
            <div className="hero-feather">✦</div>
          </div>
        </div>
      </section>
      <section className="shell section-pad home-category-section pt-0">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {isArabic ? "تصفح حسب احتياجك" : "Browse by feeling"}
            </p>
            <h2 className="section-title">
              {isArabic ? (
                <>
                  ابدأ بما
                  <br />
                  <em>تحتاجه.</em>
                </>
              ) : (
                <>
                  Start with what
                  <br />
                  <em>you need.</em>
                </>
              )}
            </h2>
          </div>
          <Link href="/marketplace" className="text-link">
            {isArabic ? "عرض كل الإعلانات" : "View all listings"}{" "}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.isLoading
            ? [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card" />
              ))
            : categories.data?.map(category => {
                const CategoryIcon =
                  categoryIcons[category.slug as keyof typeof categoryIcons] ||
                  Sparkles;
                return (
                  <Link
                    key={category.id}
                    href={`/marketplace?category=${category.id}`}
                    className={`category-card category-${category.accent} category-${category.slug}`}
                  >
                    <span className="category-icon">
                      <CategoryIcon
                        size={32}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="category-name">
                      {isArabic ? category.nameAr : category.nameEn}
                    </span>
                    <span dir="rtl" className="category-ar">
                      {isArabic ? category.nameEn : category.nameAr}
                    </span>
                    <ChevronRight className="category-arrow" size={17} />
                  </Link>
                );
              })}
        </div>
        <div className="home-quick-tools" aria-label={isArabic ? "اختصارات إعلانات الطيور" : "Bird listing shortcuts"}>
          {(["birds", "food", "cages"] as const).map(slug => {
            const category = categories.data?.find(item => item.slug === slug);
            if (!category) return <div key={slug} className="category-card home-tool-card home-ad-card animate-pulse" />;
            const CategoryIcon = categoryIcons[slug];
            return (
              <Link key={category.id} href={`/marketplace?category=${category.id}`} className={`category-card home-tool-card home-ad-card category-${category.accent} category-${category.slug}`}>
                <span className="category-icon"><CategoryIcon size={25} strokeWidth={1.8} /></span>
                <span className="category-name">{isArabic ? category.nameAr : category.nameEn}</span>
                <span className="category-ar">{isArabic ? "شاهد الإعلانات" : "Browse listings"}</span>
                <ChevronRight className="category-arrow" size={17} />
              </Link>
            );
          })}
        </div>
        <HomePromoBanner isArabic={isArabic} listings={listings.data || []} />
      </section>
      <section className="bg-[#eaf1ea] home-listings-section py-20">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isArabic ? "جديد من الحي" : "Fresh from the neighbourhood"}
              </p>
              <h2 className="section-title">
                {isArabic ? (
                  <>
                    طيور جميلة.
                    <br />
                    <em>بيوت طيبة.</em>
                  </>
                ) : (
                  <>
                    Lovely birds.
                    <br />
                    <em>Good homes.</em>
                  </>
                )}
              </h2>
            </div>
            <Link href="/marketplace" className="text-link">
              {isArabic ? "شاهد السوق" : "See the marketplace"}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
          {listings.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl bg-white/70"
                />
              ))}
            </div>
          ) : listings.data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.data.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Bird size={30} />
              <p>
                {isArabic
                  ? "لا توجد إعلانات عامة بعد. كن أول من يشارك."
                  : "No public listings yet. Be the first to share one."}
              </p>
              <Link href="/sell" className="text-link">
                {t("postListing")} <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

type PromoBannerProps = { isArabic: boolean; listings: Array<{ id: number; titleAr: string | null; titleEn: string; coverImage: string | null }> };

function HomePromoBanner({ isArabic, listings }: PromoBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const liveProducts = trpc.recommended.list.useQuery();
  const latestListing = listings[0];
  const latestProduct = liveProducts.data?.[0];
  const fallbackProduct = RECOMMENDED_PRODUCTS[0];
  const product = latestProduct || fallbackProduct;
  const latestDirectory = DIRECTORY_ENTRIES[0];
  const slides = [
    { id: "picks", href: "/recommended", image: latestProduct?.imageUrl || fallbackProduct.image, badge: isArabic ? "آخر اختيار من دليلنا" : "Latest pick from our guide", title: isArabic ? product.nameAr : product.nameEn, description: isArabic ? product.descriptionAr : product.descriptionEn, cta: isArabic ? "شوف اختياراتنا" : "See our picks", tone: "home-promo-sand" },
    { id: "directory", href: "/directory", image: "/images/hurghada-budgie-card.jpg", badge: isArabic ? "آخر مكان في الدليل" : "Latest directory entry", title: isArabic ? latestDirectory.nameAr : latestDirectory.nameEn, description: isArabic ? latestDirectory.noteAr : latestDirectory.noteEn, cta: isArabic ? "افتح الدليل" : "Open the directory", tone: "home-promo-sky" },
    { id: "marketplace", href: latestListing ? `/listing/${latestListing.id}` : "/marketplace", image: latestListing?.coverImage || "/images/listing-cockatiel.jpg", badge: isArabic ? "أحدث إعلان في السوق" : "Latest marketplace listing", title: latestListing ? (isArabic && latestListing.titleAr ? latestListing.titleAr : latestListing.titleEn) : (isArabic ? "دور على طيرك الجديد" : "Find your next bird"), description: latestListing ? (isArabic ? "إعلان جديد من مجتمع طيور الحب." : "A fresh listing from the Bird Lovers community.") : (isArabic ? "تصفح أحدث إعلانات الطيور بصور وتفاصيل واضحة." : "Browse bird listings with clear photos and details."), cta: isArabic ? "شوف الإعلان" : "View the listing", tone: "home-promo-mint" },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex(current => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[activeIndex];
  const move = (direction: number) => setActiveIndex(current => (current + direction + slides.length) % slides.length);

  return (
    <section className="home-promo-wrap" aria-label={isArabic ? "إعلانات واختيارات Bird Lovers" : "Bird Lovers promotions and picks"}>
      <div className={`home-promo ${activeSlide.tone}`}>
        <div className="home-promo-image-wrap">
          <img key={activeSlide.id} src={activeSlide.image} alt={activeSlide.title} className="home-promo-image" />
          <span className="home-promo-count">{activeIndex + 1} / {slides.length}</span>
        </div>
        <div className="home-promo-content">
          <span className="home-promo-badge"><Sparkles size={13} /> {activeSlide.badge}</span>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.description}</p>
          <Link href={activeSlide.href} className="home-promo-cta">{activeSlide.cta} <ArrowRight size={15} /></Link>
        </div>
        <div className="home-promo-controls">
          <button type="button" onClick={() => move(-1)} aria-label={isArabic ? "الإعلان السابق" : "Previous promotion"}><ChevronRight size={18} /></button>
          <div className="home-promo-dots" role="tablist" aria-label={isArabic ? "شرائح الإعلانات" : "Promotion slides"}>
            {slides.map((slide, index) => <button key={slide.id} type="button" role="tab" aria-selected={activeIndex === index} aria-label={`${isArabic ? "الشريحة" : "Slide"} ${index + 1}`} onClick={() => setActiveIndex(index)} className={activeIndex === index ? "is-active" : ""} />)}
          </div>
          <button type="button" onClick={() => move(1)} aria-label={isArabic ? "الإعلان التالي" : "Next promotion"}><ChevronLeft size={18} /></button>
        </div>
      </div>
    </section>
  );
}
