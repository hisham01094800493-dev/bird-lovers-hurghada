import { ArrowLeft, ArrowRight, CircleDollarSign } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICE_REFERENCES } from "@/data/priceGuide";
import { trpc } from "@/lib/trpc";

export default function PriceTicker() {
  const { isArabic } = useLanguage();
  const prices = trpc.prices.list.useQuery();
  const items = prices.data?.length ? prices.data : PRICE_REFERENCES;
  const content = items.map(item => `${isArabic ? item.birdAr : item.birdEn}: ${item.range}`).join("   •   ");
  const lastUpdated = items.reduce((latest, item) => item.checkedOn > latest ? item.checkedOn : latest, "");

  return <div className="price-ticker border-b border-[#dce7df] bg-[#183b39] text-[#f7f5ef]" dir={isArabic ? "rtl" : "ltr"}>
    <div className="shell flex min-h-11 items-center gap-3 overflow-hidden">
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#f0d487]"><CircleDollarSign size={16} />{isArabic ? "مؤشر أسعار استرشادي" : "Indicative price guide"}</span>
      <div className="price-ticker-window min-w-0 flex-1 overflow-hidden" dir="ltr">
        <div className="price-ticker-track whitespace-nowrap text-xs text-[#dceadd]">
          <span dir={isArabic ? "rtl" : "ltr"}>{content}</span>
          <span aria-hidden="true" dir={isArabic ? "rtl" : "ltr"}>{content}</span>
        </div>
      </div>
      <Link href="/prices" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white underline decoration-[#f0d487] underline-offset-4">{isArabic ? "التفاصيل" : "Details"}{isArabic ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}</Link>
    </div>
    <p className="sr-only">{isArabic ? `آخر مراجعة ${lastUpdated}` : `Last reviewed ${lastUpdated}`}</p>
  </div>;
}
