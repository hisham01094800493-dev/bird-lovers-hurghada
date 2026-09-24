import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Bird,
  Calculator,
  ChevronRight,
  Heart,
  House,
  MapPin,
  MessageCircle,
  ThermometerSun,
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
import AdSlot from "@/components/AdSlot";
import { useLanguage } from "@/contexts/LanguageContext";

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
        <div
          className="home-quick-tools"
          aria-label={isArabic ? "أدوات مفيدة" : "Helpful tools"}
        >
          <Link
            href="/care-tools"
            className="category-card home-tool-card home-tool-calculator"
          >
            <span className="category-icon">
              <Calculator size={25} strokeWidth={1.8} />
            </span>
            <span className="category-name">
              {isArabic ? "حاسبة التكلفة" : "Cost calculator"}
            </span>
            <span className="category-ar">
              {isArabic ? "اعرف ميزانيتك" : "Plan your budget"}
            </span>
            <ChevronRight className="category-arrow" size={17} />
          </Link>
          <Link
            href="/care-tools"
            className="category-card home-tool-card home-tool-tips"
          >
            <span className="category-icon">
              <ThermometerSun size={25} strokeWidth={1.8} />
            </span>
            <span className="category-name">
              {isArabic ? "نصائح موسمية" : "Seasonal tips"}
            </span>
            <span className="category-ar">
              {isArabic ? "رعاية في وقتها" : "Care in season"}
            </span>
            <ChevronRight className="category-arrow" size={17} />
          </Link>
          <Link
            href="/community"
            className="category-card home-tool-card home-tool-community"
          >
            <span className="category-icon">
              <MessageCircle size={25} strokeWidth={1.8} />
            </span>
            <span className="category-name">
              {isArabic ? "اسأل مجتمع الهواة" : "Ask the community"}
            </span>
            <span className="category-ar">
              {isArabic ? "خبرة تساعدك" : "Helpful local advice"}
            </span>
            <ChevronRight className="category-arrow" size={17} />
          </Link>
        </div>
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
      <section className="shell home-join-section pb-12">
        <div className="join-strip">
          <div className="flex items-center gap-4">
            <span className="join-icon">
              <MapPin size={20} />
            </span>
            <div>
              <p className="font-semibold text-[#183b39]">
                {isArabic
                  ? "للغردقة، وللبحر الأحمر."
                  : "Made for Hurghada, ready for the Red Sea."}
              </p>
              <p className="mt-1 text-sm text-[#758a84]">
                {isArabic
                  ? "ابدأ محليًا، وتوسع بعناية."
                  : "Start local. Grow thoughtfully."}
              </p>
            </div>
          </div>
          <Link href="/sell" className="text-link">
            {isArabic ? "انضم إلى السرب" : "Join the flock"}{" "}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <AdSlot
        image="/images/bird-lovers-group.jpg"
        imageAlt={isArabic ? "طيور بادجي ملونة" : "Colourful budgies"}
        title={
          isArabic ? "جروب Bird Lovers Hurghada" : "Bird Lovers Hurghada group"
        }
        description={
          isArabic
            ? "انضم إلى الجروب المحلي لمحبي الطيور وتبادل الخبرات."
            : "Join the local bird-lovers group and share useful tips."
        }
        cta={isArabic ? "انضم للجروب" : "Join the group"}
        href="https://www.facebook.com/groups/798363001904219/?ref=share_group_link"
        external
      />
    </SiteShell>
  );
}
