import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MapPin,
  MapPinned,
  Phone,
  Stethoscope,
  Store,
} from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { DIRECTORY_ENTRIES } from "@/data/discovery";

export default function Directory() {
  const { isArabic } = useLanguage();
  const [filter, setFilter] = useState<"all" | "clinic" | "shop">("all");
  const entries = useMemo(
    () =>
      filter === "all"
        ? DIRECTORY_ENTRIES
        : DIRECTORY_ENTRIES.filter(entry => entry.kind === filter),
    [filter]
  );

  return (
    <SiteShell>
      <section className="shell page-hero">
        <div>
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> {isArabic ? "الرئيسية" : "Home"}
          </Link>
          <p className="eyebrow mt-6 flex items-center gap-2">
            <span className="eyebrow-dot" />
            {isArabic ? "دليل محلي قابل للتحديث" : "A local guide we keep updating"}
          </p>
          <h1 className="page-title mt-3">
            {isArabic ? (
              <>خدمات الطيور<br /><em>حولك.</em></>
            ) : (
              <>Bird care<br /><em>near you.</em></>
            )}
          </h1>
          <p className="page-lede">
            {isArabic
              ? "عيادات ومحلات في الغردقة مع أرقام اتصال وروابط مباشرة للخريطة. اتصل قبل الذهاب للتأكد من المواعيد وتوافر خدمة الطيور."
              : "Clinics and pet shops in Hurghada with phone numbers and direct map links. Call ahead to confirm hours and bird-care availability."}
          </p>
        </div>
        <div className="grid size-24 place-items-center rounded-[30px] bg-[#eaf1ea] text-[#d26246] shadow-sm">
          <MapPinned size={42} />
        </div>
      </section>

      <section className="shell pb-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{isArabic ? "الدليل" : "Directory"}</p>
            <p className="mt-1 text-sm text-[#82958e]">
              {entries.length} {isArabic ? "أماكن مقترحة" : "suggested places"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={isArabic ? "تصفية الدليل" : "Directory filters"}>
            {([
              ["all", isArabic ? "الكل" : "All"],
              ["clinic", isArabic ? "عيادات" : "Clinics"],
              ["shop", isArabic ? "محلات" : "Shops"],
            ] as const).map(([value, label]) => (
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

        <div className="grid gap-5 md:grid-cols-2">
          {entries.map(entry => {
            const isClinic = entry.kind === "clinic";
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.mapQuery)}`;
            return (
              <article key={entry.id} className="overflow-hidden rounded-[24px] border border-[#dce7df] bg-white shadow-[0_10px_30px_rgba(24,59,57,.06)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#eef2ed] bg-[#f7faf5] p-5">
                  <div className="flex items-start gap-3">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isClinic ? "bg-[#e5e1f8] text-[#6856a6]" : "bg-[#f9ead8] text-[#c16b43]"}`}>
                      {isClinic ? <Stethoscope size={23} /> : <Store size={23} />}
                    </span>
                    <div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#82958e]">
                        {isClinic ? (isArabic ? "عيادة" : "Clinic") : isArabic ? "محل" : "Pet shop"}
                      </span>
                      <h2 className="mt-2 font-display text-xl font-semibold text-[#183b39]">
                        {isArabic ? entry.nameAr : entry.nameEn}
                      </h2>
                    </div>
                  </div>
                  <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="text-[#82958e]" title={isArabic ? "مصدر البيانات" : "Data source"}>
                    <ExternalLink size={16} />
                  </a>
                </div>
                <div className="space-y-4 p-5">
                  <a href={`tel:${entry.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-xl bg-[#eef5ed] px-3 py-3 text-sm font-bold text-[#183b39] hover:bg-[#e5eee4]">
                    <Phone size={17} className="text-[#d26246]" />
                    <span dir="ltr">{entry.phone}</span>
                    <ArrowRight size={15} className="ml-auto" />
                  </a>
                  <div className="flex items-start gap-3 text-sm leading-6 text-[#69807b]">
                    <MapPin size={17} className="mt-1 shrink-0 text-[#76a68f]" />
                    <span>{isArabic ? entry.addressAr : entry.addressEn}</span>
                  </div>
                  <p className="rounded-xl bg-[#fff9e9] px-3 py-3 text-xs leading-5 text-[#68572d]">
                    {isArabic ? entry.noteAr : entry.noteEn}
                  </p>
                  <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#52766d] underline decoration-[#d26246] underline-offset-4">
                    <MapPinned size={16} /> {isArabic ? "افتح على الخريطة" : "Open in Maps"}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#d9d2ef] bg-[#f4f0fb] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#183b39]">{isArabic ? "هل تملك محلًا أو عيادة؟" : "Run a shop or clinic?"}</h2>
            <p className="mt-1 text-sm leading-6 text-[#69807b]">{isArabic ? "أرسل بياناتك لنضيفها بعد التحقق منها." : "Send your details and we will add them after verification."}</p>
          </div>
          <Link href="/contact" className="cta-primary inline-flex shrink-0 items-center justify-center gap-2">{isArabic ? "أضف بياناتك" : "Add your details"} <ArrowRight size={16} /></Link>
        </div>
      </section>
    </SiteShell>
  );
}
