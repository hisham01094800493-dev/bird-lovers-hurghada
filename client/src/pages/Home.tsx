import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Bird,
  Calculator,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  Heart,
  House,
  MessageCircle,
  Package,
  PawPrint,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ThermometerSun,
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
  const [preference, setPreference] = useState<"beginner" | "quiet" | "social">("beginner");
  const categories = trpc.categories.list.useQuery();
  const listings = trpc.listings.list.useQuery({ limit: 6, offset: 0 });
  const posts = trpc.community.list.useQuery();
  const care = trpc.care.overview.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const weather = care.data?.weather;
  const weatherAdvice = weather?.level === "critical"
    ? (isArabic ? "حر شديد — ظل وماء متجدد طوال اليوم" : "Extreme heat — provide shade and fresh water all day")
    : weather?.level === "watch"
      ? (isArabic ? "حرارة مرتفعة — أبعد القفص عن شمس الظهر" : "High heat — keep the cage away from midday sun")
      : (isArabic ? "جو مناسب — حافظ على تهوية وماء نظيف" : "Comfortable day — keep airflow and clean water");
  const recommendation = preference === "quiet"
    ? { ar: "كناري هادئ", en: "A calm canary", noteAr: "بداية لطيفة لمحبي الهدوء والصوت الجميل.", noteEn: "A gentle start for quiet homes and beautiful songs." }
    : preference === "social"
      ? { ar: "كوكتيل أليف", en: "A friendly cockatiel", noteAr: "رفيق اجتماعي يحب الصحبة والاهتمام اليومي.", noteEn: "A social companion who enjoys daily attention." }
      : { ar: "بادجي مناسب للمبتدئين", en: "A beginner-friendly budgie", noteAr: "اختيار عملي كبداية مع رعاية بسيطة وممتعة.", noteEn: "A cheerful first bird with simple, rewarding care." };
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
      <section className="shell home-discovery-strip" aria-label={isArabic ? "اختيارات سريعة للزائر" : "Quick visitor choices"}>
        <div className="home-live-strip">
          <div className="home-live-title"><span className="home-live-dot" /> <strong>{isArabic ? "آخر ما يحدث" : "Happening now"}</strong><small>{isArabic ? "اسحب لتستكشف" : "Swipe to explore"}</small></div>
          <div className="home-live-items">
            {(posts.data?.slice(0, 4).map(post => ({ label: isArabic ? "سؤال جديد" : "New question", title: post.title })) ?? [
              { label: isArabic ? "نصيحة اليوم" : "Today’s tip", title: isArabic ? "كيف تحافظ على ماء طائرك في الحر؟" : "How to keep your bird’s water fresh in the heat?" },
              { label: isArabic ? "مجتمع الهواة" : "Community", title: isArabic ? "اسأل أهل الخبرة قبل ما تشتري" : "Ask experienced bird lovers before you buy" },
              { label: isArabic ? "إعلان جديد" : "New listing", title: isArabic ? "اكتشف الطيور المتاحة في الغردقة" : "Discover birds available in Hurghada" },
            ]).map((item, index) => <Link key={`${item.label}-${index}`} href={item.label.includes("إعلان") || item.label.includes("listing") ? "/marketplace" : item.label.includes("نصيحة") || item.label.includes("tip") ? "/care-tools" : "/community"} className="home-live-item"><small>{item.label}</small><span>{item.title}</span><ArrowRight size={14} /></Link>)}
          </div>
        </div>
        <div className="home-intent-panel">
          <div className="home-mini-heading">
            <p className="eyebrow">{isArabic ? "اختيارك يبدأ هنا" : "Start here"}</p>
            <h2>{isArabic ? "ماذا تريد اليوم؟" : "What do you need today?"}</h2>
          </div>
          <div className="home-intent-grid">
            <Link href="/marketplace" className="home-intent-card home-intent-birds"><span className="home-intent-icon"><ShoppingBag size={19} /></span><span><strong>{isArabic ? "أريد شراء طائر" : "Find a bird"}</strong><small>{isArabic ? "تصفح الإعلانات" : "Browse listings"}</small></span><ArrowRight size={15} /></Link>
            <Link href="/marketplace" className="home-intent-card home-intent-food"><span className="home-intent-icon"><Wheat size={19} /></span><span><strong>{isArabic ? "أبحث عن غذاء" : "Find food"}</strong><small>{isArabic ? "اختيارات يومية" : "Everyday supplies"}</small></span><ArrowRight size={15} /></Link>
            <Link href="/care-tools" className="home-intent-card home-intent-care"><span className="home-intent-icon"><Calculator size={19} /></span><span><strong>{isArabic ? "أحتاج نصيحة" : "Need care advice"}</strong><small>{isArabic ? "احسب واعرف" : "Plan with confidence"}</small></span><ArrowRight size={15} /></Link>
            <Link href="/community" className="home-intent-card home-intent-community"><span className="home-intent-icon"><MessageCircle size={19} /></span><span><strong>{isArabic ? "أسأل الهواة" : "Ask the community"}</strong><small>{isArabic ? "خبرة من أهلها" : "Learn from bird lovers"}</small></span><ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="home-recommend-card">
          <div className="home-recommend-copy"><span className="home-feature-label">{isArabic ? "مناسب لك" : "Picked for you"}</span><h2>{isArabic ? recommendation.ar : recommendation.en}</h2><p>{isArabic ? recommendation.noteAr : recommendation.noteEn}</p><Link href="/marketplace" className="home-feature-link">{isArabic ? "شوف الإعلانات" : "See listings"} <ArrowRight size={14} /></Link></div>
          <div className="home-recommend-choices"><small>{isArabic ? "اختار ما يهمك" : "Tell us what matters"}</small><div>{(["beginner", "quiet", "social"] as const).map(option => <button key={option} type="button" onClick={() => setPreference(option)} className={preference === option ? "is-active" : ""}>{option === "beginner" ? (isArabic ? "أول طائر" : "First bird") : option === "quiet" ? (isArabic ? "هادئ" : "Calm") : (isArabic ? "اجتماعي" : "Social")}</button>)}</div></div>
        </div>
        <div className="home-feature-cards">
          <Link href="/care-tools" className="home-weather-card">
            <div className="home-feature-top"><span className="home-feature-icon home-weather-icon"><ThermometerSun size={20} /></span><span className="home-feature-label">{isArabic ? "طقس الغردقة اليوم" : "Hurghada today"}</span><CloudSun size={18} /></div>
            <div className="home-weather-reading">{weather?.temperature === null || weather?.temperature === undefined ? "—" : `${Math.round(weather.temperature)}°`}<small>C</small></div>
            <p>{weatherAdvice}</p>
            <span className="home-feature-link">{isArabic ? "شوف النصيحة" : "See the care tip"} <ArrowRight size={14} /></span>
          </Link>
          <Link href="/care-tools" className="home-bird-of-day-card">
            <div className="home-bird-of-day-copy"><span className="home-feature-label">{isArabic ? "طائر اليوم" : "Bird of the day"}</span><h3>{isArabic ? "كوكاتو أبيض ورفيق كوكتيل" : "White cockatoo & cockatiel friend"}</h3><p>{isArabic ? "اجتماعيان ويحبّان الصحبة والاهتمام الهادئ." : "Social birds who enjoy gentle company and daily care."}</p><span className="home-feature-link">{isArabic ? "اعرف أكثر" : "Learn more"} <ArrowRight size={14} /></span></div>
            <img src="/images/hurghada-parrot-hero.jpg" alt={isArabic ? "كوكاتو أبيض مع كوكتيل أصفر" : "White cockatoo with a yellow cockatiel"} />
          </Link>
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
        <div className="home-care-tools" aria-label={isArabic ? "أدوات الرعاية" : "Care tools"}>
          <Link href="/care-tools" className="category-card home-tool-card home-tool-calculator">
            <span className="category-icon"><Calculator size={25} strokeWidth={1.8} /></span>
            <span className="category-name">{isArabic ? "حاسبة التكلفة" : "Cost calculator"}</span>
            <span className="category-ar">{isArabic ? "اعرف ميزانيتك" : "Plan your budget"}</span>
            <ChevronRight className="category-arrow" size={17} />
          </Link>
          <Link href="/care-tools" className="category-card home-tool-card home-tool-tips">
            <span className="category-icon"><ThermometerSun size={25} strokeWidth={1.8} /></span>
            <span className="category-name">{isArabic ? "نصائح موسمية" : "Seasonal tips"}</span>
            <span className="category-ar">{isArabic ? "رعاية في وقتها" : "Care in season"}</span>
            <ChevronRight className="category-arrow" size={17} />
          </Link>
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
