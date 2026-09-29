import { ArrowLeft, ArrowRight } from "lucide-react";
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
    <div className="shell overflow-hidden py-2.5">
      <div className="price-ticker-heading">
        <div>
          <strong>{isArabic ? "مؤشر أسعار الأسبوع الحالي" : "This week's price guide"}</strong>
          <span>{isArabic ? "يتحدث كل جمعة" : "Updated every Friday"}</span>
        </div>
        <Link href="/prices" className="price-ticker-details">{isArabic ? "التفاصيل" : "Details"}{isArabic ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}</Link>
      </div>
      <div className="price-ticker-window overflow-hidden" dir="ltr">
        <div className="price-ticker-track whitespace-nowrap text-sm text-[#dceadd]">
          <span dir={isArabic ? "rtl" : "ltr"}>{content}</span>
          <span aria-hidden="true" dir={isArabic ? "rtl" : "ltr"}>{content}</span>
        </div>
      </div>
    </div>
    <p className="sr-only">{isArabic ? `آخر مراجعة ${lastUpdated}` : `Last reviewed ${lastUpdated}`}</p>
  </div>;
}
