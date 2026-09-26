import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { RECOMMENDED_PRODUCTS } from "@/data/discovery";
import { trpc } from "@/lib/trpc";

const handleNoonPurchase = (coupon: string, destination = "https://www.noon.com/egypt-ar/") => {
  if (coupon) {
    navigator.clipboard?.writeText(coupon);
    alert(`تم نسخ كود الخصم (${coupon}) بنجاح! استخدمه عند الدفع على نون للاستفادة من الخصم.`);
  }
  window.open(destination, "_blank", "noopener,noreferrer");
};

export default function Recommended() {
  const { isArabic } = useLanguage();
  const liveProducts = trpc.recommended.list.useQuery();
  const productSource = liveProducts.data?.length
    ? liveProducts.data.map(product => ({
        ...product,
        image: product.imageUrl,
        buyUrl: product.affiliateUrl,
      }))
    : RECOMMENDED_PRODUCTS;
  const [filter, setFilter] = useState<"all" | "food" | "care" | "housing">("all");
  const products = useMemo(
    () =>
      filter === "all"
        ? productSource
        : productSource.filter(product => product.category === filter),
    [filter, liveProducts.data]
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
          {products.map(product => {
            const noonHref = product.noonUrl || "https://www.noon.com/egypt-ar/";
            return (
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
                <div className="mt-5 space-y-3 border-t border-[#eef2ed] pt-4">
                  <span className="text-xs font-bold text-[#82958e]">{isArabic ? product.priceAr : product.priceEn}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <a href={product.buyUrl} target="_blank" rel="sponsored nofollow noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d26246] px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#b95138]">
                      {isArabic ? "شراء من أمازون" : "Buy from Amazon"} <ExternalLink size={14} />
                    </a>
                    <button type="button" onClick={() => handleNoonPurchase(product.noonCoupon, noonHref)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c24b] px-3 py-2.5 text-xs font-extrabold text-[#3d3214] transition hover:bg-[#e8b536]">
                      {isArabic ? "شراء من نون" : "Buy from Noon"} <ExternalLink size={14} />
                    </button>
                  </div>
                  {product.noonCoupon && <p className="rounded-lg bg-[#fff8df] px-3 py-2 text-center text-[11px] font-bold text-[#78601d]">{isArabic ? "كود خصم نون:" : "Noon coupon:"} <span dir="ltr">{product.noonCoupon}</span></p>}
                </div>
              </div>
            </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-[#dce7df] bg-[#eef5ed] p-5">
            <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#52766d]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#183b39]">{isArabic ? "اختيار مسؤول" : "Responsible picks"}</h2>
              <p className="mt-1 text-sm leading-6 text-[#69807b]">{isArabic ? "لا نضمن جودة أو توافر أي منتج. افحص المكونات والمقاس وملاءمته لنوع طائرك." : "We do not guarantee product quality or stock. Check ingredients, size and suitability for your bird."}</p>
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
