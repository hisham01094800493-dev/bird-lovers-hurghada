import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  HeartHandshake,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { RECOMMENDED_PRODUCTS } from "@/data/discovery";

export default function Recommended() {
  const { isArabic } = useLanguage();
  const [filter, setFilter] = useState<"all" | "food" | "care" | "housing">("all");
  const products = useMemo(
    () =>
      filter === "all"
        ? RECOMMENDED_PRODUCTS
        : RECOMMENDED_PRODUCTS.filter(product => product.category === filter),
    [filter]
  );
  const categories = [
    ["all", isArabic ? "الكل" : "All"],
    ["food", isArabic ? "غذاء" : "Food"],
    ["care", isArabic ? "رعاية" : "Care"],
    ["housing", isArabic ? "نقل وتجهيز" : "Housing & travel"],
  ] as const;

  return (
    <SiteShell>
      <section className="shell page-hero">
        <div>
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> {isArabic ? "الرئيسية" : "Home"}
          </Link>
          <p className="eyebrow mt-6 flex items-center gap-2">
            <span className="eyebrow-dot" />
            {isArabic ? "اختيارات عملية لمحبي الطيور" : "Practical picks for bird lovers"}
          </p>
          <h1 className="page-title mt-3">
            {isArabic ? <>اختيارات<br /><em>نحبها.</em></> : <>Products<br /><em>worth a look.</em></>}
          </h1>
          <p className="page-lede">
            {isArabic
              ? "منتجات نرشحها كبداية للتغذية والرعاية والنقل. راجع السعر والتقييمات قبل الشراء لأن الأسعار والتوافر يتغيران."
              : "A short list for food, care and safe travel. Check the current price and reviews before buying because availability changes."}
          </p>
        </div>
        <div className="grid size-24 place-items-center rounded-[30px] bg-[#fff1e7] text-[#d26246] shadow-sm">
          <ShoppingBag size={42} />
        </div>
      </section>

      <section className="shell pb-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{isArabic ? "دليل الشراء" : "Buying guide"}</p>
            <p className="mt-1 text-sm text-[#82958e]">{isArabic ? "روابط شراء مباشرة" : "Direct shopping links"}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={isArabic ? "تصفية المنتجات" : "Product filters"}>
            {categories.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${filter === value ? "bg-[#183b39] text-white" : "border border-[#dce7df] bg-white text-[#52766d] hover:bg-[#eef5ed]"}`}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <article key={product.id} className="group overflow-hidden rounded-[24px] border border-[#dce7df] bg-white shadow-[0_10px_30px_rgba(24,59,57,.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(24,59,57,.10)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#eef5ed]">
                <img src={product.image} alt={isArabic ? product.nameAr : product.nameEn} className="size-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#52766d] shadow-sm backdrop-blur">
                  {isArabic ? product.tagAr : product.tagEn}
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-display text-2xl font-semibold text-[#183b39]">{isArabic ? product.nameAr : product.nameEn}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#69807b]">{isArabic ? product.descriptionAr : product.descriptionEn}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef2ed] pt-4">
                  <span className="text-xs font-bold text-[#82958e]">{isArabic ? product.priceAr : product.priceEn}</span>
                  <a href={product.buyUrl} target="_blank" rel="sponsored nofollow noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#d26246] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#b95138]">
                    {isArabic ? "اشترِ الآن" : "Buy now"} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-[#dce7df] bg-[#eef5ed] p-5">
            <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#52766d]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#183b39]">{isArabic ? "اختيار مسؤول" : "Responsible picks"}</h2>
              <p className="mt-1 text-sm leading-6 text-[#69807b]">{isArabic ? "لا نضمن جودة أو توافر أي منتج. افحص المكونات والمقاس وملاءمته لنوع طائرك." : "We do not guarantee product quality or stock. Check ingredients, size and suitability for your bird."}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#ead9a5] bg-[#fff9e9] p-5">
            <HeartHandshake size={21} className="mt-0.5 shrink-0 text-[#c49752]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#183b39]">{isArabic ? "إفصاح الروابط" : "Link disclosure"}</h2>
              <p className="mt-1 text-sm leading-6 text-[#68572d]">{isArabic ? "بعض الروابط قد تصبح روابط أفلييت لاحقًا. لن يتغير السعر عليك، وقد يحصل الموقع على عمولة صغيرة." : "Some links may become affiliate links. Your price does not change, and the site may receive a small commission."}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#d9d2ef] bg-[#f4f0fb] p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-1 shrink-0 text-[#6856a6]" />
            <div>
              <h2 className="font-display text-xl font-semibold text-[#183b39]">{isArabic ? "لديك منتج مفيد؟" : "Have a useful product?"}</h2>
              <p className="mt-1 text-sm leading-6 text-[#69807b]">{isArabic ? "أرسل لنا التفاصيل لنراجعه ونضيفه إلى الدليل." : "Send us the details for review and we may add it to the guide."}</p>
              <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#6856a6] underline underline-offset-4">{isArabic ? "تواصل معنا" : "Contact us"} <ArrowRight size={15} /></Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
