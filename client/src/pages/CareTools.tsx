import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Droplets,
  Feather,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sun,
  ThermometerSun,
  Wind,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const birdTypes = [
  {
    id: "budgie",
    ar: "بادجي",
    en: "Budgie",
    food: 180,
    care: 100,
    color: "#76a68f",
  },
  {
    id: "canary",
    ar: "كناري",
    en: "Canary",
    food: 220,
    care: 120,
    color: "#c49752",
  },
  {
    id: "lovebird",
    ar: "فيشر / روز",
    en: "Lovebird",
    food: 260,
    care: 140,
    color: "#d26246",
  },
  {
    id: "parrot",
    ar: "ببغاء متوسط",
    en: "Medium parrot",
    food: 650,
    care: 280,
    color: "#4c8a91",
  },
  {
    id: "pigeon",
    ar: "حمام",
    en: "Pigeon",
    food: 140,
    care: 80,
    color: "#8b79a7",
  },
] as const;

const fallbackTips = [
  {
    seasonKey: "hurghada_summer_heat",
    startMonth: 5,
    endMonth: 8,
    titleAr: "حر الصيف في الغردقة",
    titleEn: "Hurghada summer heat",
    bodyAr:
      "غيّر المياه أكثر من مرة يوميًا، وفّر ظلًا وتهوية جيدة، ولا تترك القفص في شمس الظهر.",
    bodyEn:
      "Refresh water more than once daily, provide shade and airflow, and keep cages away from midday sun.",
    icon: "thermometer",
    accent: "#d26246",
  },
  {
    seasonKey: "moulting_season",
    startMonth: 8,
    endMonth: 10,
    titleAr: "موسم تغيير الريش",
    titleEn: "Moulting season",
    bodyAr:
      "قدّم غذاءً متوازنًا ومصدر كالسيوم، وقلّل التوتر وتجنّب نقل القفص كثيرًا.",
    bodyEn:
      "Offer a balanced diet and calcium source, reduce stress, and avoid frequent cage moves.",
    icon: "feather",
    accent: "#76a68f",
  },
  {
    seasonKey: "breeding_season",
    startMonth: 1,
    endMonth: 5,
    titleAr: "فترة التزاوج",
    titleEn: "Breeding season",
    bodyAr: "راقب السلوك والتغذية، ولا تبدأ التفريخ إلا مع زوج سليم ومكان آمن.",
    bodyEn:
      "Watch behaviour and nutrition, and only start breeding with a healthy pair and a safe setup.",
    icon: "sun",
    accent: "#c49752",
  },
];

function readReminderPreference() {
  try {
    return localStorage.getItem("bird-lovers-seasonal-reminders") === "on";
  } catch {
    return false;
  }
}
function iconFor(name: string) {
  return name === "thermometer"
    ? ThermometerSun
    : name === "feather"
      ? Feather
      : Sun;
}
function formatNumber(value: number | null, language: "ar" | "en") {
  return value === null
    ? "—"
    : value.toLocaleString(language === "ar" ? "ar-EG" : "en-EG", {
        maximumFractionDigits: 0,
      });
}
function isInSeason(month: number, startMonth: number, endMonth: number) {
  return startMonth <= endMonth
    ? month >= startMonth && month <= endMonth
    : month >= startMonth || month <= endMonth;
}
function monthRange(startMonth: number, endMonth: number, isArabic: boolean) {
  const formatter = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-EG", {
    month: "short",
  });
  const start = formatter.format(new Date(2026, startMonth - 1, 1));
  const end = formatter.format(new Date(2026, endMonth - 1, 1));
  return startMonth === endMonth ? start : `${start} – ${end}`;
}

export default function CareTools() {
  const { isArabic, language } = useLanguage();
  const care = trpc.care.overview.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const [birdType, setBirdType] = useState("budgie");
  const [count, setCount] = useState(1);
  const [remindersOn, setRemindersOn] = useState(readReminderPreference);
  const selected = birdTypes.find(item => item.id === birdType) ?? birdTypes[0];
  const total = useMemo(
    () => Math.max(1, count) * (selected.food + selected.care),
    [count, selected]
  );
  const currentMonth = new Date().getMonth() + 1;
  const todayLabel = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const tips = care.data?.tips?.length
    ? care.data.tips
    : fallbackTips.filter(tip =>
        isInSeason(currentMonth, tip.startMonth, tip.endMonth)
      );
  const weather = care.data?.weather;
  const heatLevel =
    weather?.level === "critical"
      ? "critical"
      : weather?.level === "watch"
        ? "watch"
        : "normal";

  const toggleReminders = async () => {
    if (
      !remindersOn &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        toast.error(
          isArabic
            ? "تم رفض إذن التنبيهات من المتصفح"
            : "Browser notifications were declined"
        );
        return;
      }
    }
    const next = !remindersOn;
    setRemindersOn(next);
    try {
      localStorage.setItem(
        "bird-lovers-seasonal-reminders",
        next ? "on" : "off"
      );
    } catch {
      /* local storage may be unavailable */
    }
    toast.success(
      next
        ? isArabic
          ? "تم تفعيل التذكيرات الموسمية"
          : "Seasonal reminders enabled"
        : isArabic
          ? "تم إيقاف التذكيرات الموسمية"
          : "Seasonal reminders paused"
    );
  };

  return (
    <SiteShell>
      <section className="shell page-hero">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="eyebrow-dot" />{" "}
            {isArabic ? "أدوات الرعاية" : "Care tools"}
          </p>
          <h1 className="page-title">
            {isArabic ? (
              <>
                قرار أهدى.
                <br />
                <em>رعاية أذكى.</em>
              </>
            ) : (
              <>
                Calmer choices.
                <br />
                <em>Smarter care.</em>
              </>
            )}
          </h1>
          <p className="page-lede">
            {isArabic
              ? "حاسبة سريعة وتنبيهات تتغير مع الموسم وطقس الغردقة الحقيقي."
              : "A quick calculator with alerts that adapt to the season and Hurghada’s live weather."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[#dce7df] bg-white px-4 py-3 text-sm text-[#52766d]">
          <Zap size={17} className="text-[#c49752]" />
          {isArabic ? "محدث باستمرار" : "Always up to date"}
        </div>
      </section>

      <section className="shell pb-20">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#dce7df] bg-white shadow-[0_18px_50px_rgba(24,59,57,.08)]">
            <div className="border-b border-[#eef2ed] bg-[radial-gradient(circle_at_top_right,#dcefe1,transparent_45%),#f7faf6] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[#183b39] text-white">
                      <Feather size={21} />
                    </span>
                    <div>
                      <p className="eyebrow">
                        {isArabic ? "قبل ما تشتري" : "Before you buy"}
                      </p>
                      <h2 className="font-display text-2xl font-semibold text-[#183b39]">
                        {isArabic
                          ? "حاسبة تكلفة التربية"
                          : "Monthly care calculator"}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-[#69807b]">
                    {isArabic
                      ? "اختار الطير وعدد الطيور، وشوف صورة تقريبية للميزانية الشهرية في ثواني."
                      : "Pick a bird and count to see a useful monthly budget picture in seconds."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#cfe0d4] bg-white/80 px-3 py-2 text-xs text-[#52766d]">
                  <ShieldCheck size={14} className="mr-1 inline" />
                  {isArabic ? "تقدير استرشادي" : "Indicative"}
                </div>
              </div>
            </div>
            <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_230px]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-[#315a54]">
                    {isArabic ? "اختار نوع الطير" : "Choose a bird"}
                  </label>
                  <span className="text-xs text-[#82948e]">
                    {isArabic ? "الأسعار بالجنيه" : "EGP estimates"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {birdTypes.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBirdType(item.id)}
                      className={`rounded-2xl border p-3 text-start transition ${birdType === item.id ? "border-[#76a68f] bg-[#eef5ed] shadow-[0_8px_18px_rgba(118,166,143,.18)]" : "border-[#e3ebe4] bg-[#fbfcfa] hover:border-[#b9d0bd]"}`}
                    >
                      <span
                        className="mb-3 grid size-9 place-items-center rounded-xl text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <Feather size={16} />
                      </span>
                      <strong className="block text-sm text-[#183b39]">
                        {isArabic ? item.ar : item.en}
                      </strong>
                      <small className="mt-1 block text-[11px] text-[#82948e]">
                        {item.food + item.care}{" "}
                        {isArabic ? "ج.م / طير" : "EGP / bird"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="mt-7 rounded-2xl border border-[#e3ebe4] bg-[#fbfcfa] p-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="bird-count"
                      className="text-sm font-bold text-[#315a54]"
                    >
                      {isArabic ? "عدد الطيور" : "Number of birds"}
                    </label>
                    <output className="rounded-full bg-[#183b39] px-3 py-1 text-sm font-bold text-white">
                      {count}
                    </output>
                  </div>
                  <input
                    id="bird-count"
                    type="range"
                    min="1"
                    max="20"
                    value={count}
                    onChange={event => setCount(Number(event.target.value))}
                    className="mt-4 w-full accent-[#76a68f]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-[#9aaba5]">
                    <span>1</span>
                    <span>20</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#82948e]">
                    {isArabic
                      ? "حرّك المؤشر بدل كتابة الرقم لتجربة السيناريوهات بسرعة."
                      : "Slide to compare different flock sizes quickly."}
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-[#183b39] p-5 text-white">
                <div className="absolute -right-10 -top-10 size-32 rounded-full bg-[#76a68f]/20" />
                <p className="relative text-xs font-semibold uppercase tracking-[.18em] text-[#b9d8c8]">
                  {isArabic ? "التقدير الشهري" : "Monthly estimate"}
                </p>
                <strong className="relative mt-3 block font-display text-4xl">
                  {formatNumber(total, language)}{" "}
                  <span className="text-base font-normal text-[#b9d8c8]">
                    ج.م
                  </span>
                </strong>
                <p className="relative mt-2 text-xs text-[#b9d8c8]">
                  {count} × {isArabic ? selected.ar : selected.en}
                </p>
                <div className="relative mt-8 space-y-4 text-sm">
                  <BudgetBar
                    label={isArabic ? "أكل" : "Food"}
                    value={selected.food * count}
                    max={total}
                    color="#f1d1a4"
                  />
                  <BudgetBar
                    label={isArabic ? "رعاية أساسية" : "Basic care"}
                    value={selected.care * count}
                    max={total}
                    color="#b9d8c8"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-[#eef2ed] px-6 py-4 text-xs leading-5 text-[#82948e] sm:px-8">
              <Info size={15} className="mt-0.5 shrink-0 text-[#76a68f]" />
              {isArabic
                ? "التقدير لا يشمل القفص أو الأدوية أو الطوارئ، وقد يختلف حسب جودة الأكل وحالة الطير."
                : "Excludes cages, medicine and emergencies; actual cost varies by food quality and bird condition."}
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-[28px] border p-6 shadow-[0_18px_50px_rgba(24,59,57,.08)] sm:p-8 ${heatLevel === "critical" ? "border-[#e9b3a3] bg-[#fff5f1]" : heatLevel === "watch" ? "border-[#ead9a5] bg-[#fffaf0]" : "border-[#cfe0d4] bg-[#eef5ed]"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow">
                    {isArabic ? "حالة الجو" : "Weather today"}
                  </span>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#52766d]">
                    {isArabic ? "حي" : "LIVE"}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#183b39]">
                  {isArabic ? "تنبيه الطقس" : "Weather alert"}
                </h2>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#d26246] shadow-sm">
                {heatLevel === "normal" ? (
                  <CloudSun size={23} />
                ) : (
                  <ThermometerSun size={23} />
                )}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#52766d]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5">
                <CalendarDays size={13} />
                {todayLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5">
                <MapPin size={13} />
                {isArabic ? "الغردقة" : "Hurghada"}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric
                icon={<ThermometerSun size={16} />}
                label={isArabic ? "الآن" : "Now"}
                value={
                  weather?.temperature === null ||
                  weather?.temperature === undefined
                    ? "—"
                    : `${formatNumber(weather.temperature, language)}°`
                }
              />
              <Metric
                icon={<Sun size={16} />}
                label={isArabic ? "العظمى" : "High"}
                value={
                  weather?.max === null || weather?.max === undefined
                    ? "—"
                    : `${formatNumber(weather.max, language)}°`
                }
              />
              <Metric
                icon={<Droplets size={16} />}
                label={isArabic ? "الرطوبة" : "Humidity"}
                value={
                  weather?.humidity === null || weather?.humidity === undefined
                    ? "—"
                    : `${formatNumber(weather.humidity, language)}%`
                }
              />
              <Metric
                icon={<Wind size={16} />}
                label={isArabic ? "الرياح" : "Wind"}
                value={
                  weather?.wind === null || weather?.wind === undefined
                    ? "—"
                    : `${formatNumber(weather.wind, language)} km/h`
                }
              />
            </div>
            <div className="mt-5 rounded-2xl bg-white/75 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-9 place-items-center rounded-xl ${heatLevel === "critical" ? "bg-[#d26246] text-white" : heatLevel === "watch" ? "bg-[#c49752] text-white" : "bg-[#76a68f] text-white"}`}
                >
                  <BellRing size={17} />
                </span>
                <div>
                  <strong className="block text-sm text-[#183b39]">
                    {heatLevel === "critical"
                      ? isArabic
                        ? "حرارة شديدة — اهتم بالمياه والظل الآن"
                        : "Extreme heat — water and shade now"
                      : heatLevel === "watch"
                        ? isArabic
                          ? "حرارة مرتفعة — راقب الطير اليوم"
                          : "High heat — keep an eye on your bird today"
                        : isArabic
                          ? "الجو مناسب — تابع النصائح الموسمية"
                          : "Comfortable today — follow seasonal tips"}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-[#718780]">
                    {isArabic
                      ? "نحدّث الحالة تلقائيًا عشان تعرف تتصرف بسرعة."
                      : "We keep the status fresh so you know what to do."}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleReminders}
              className={`mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${remindersOn ? "border-[#76a68f] bg-white text-[#315a54]" : "border-[#c9dbce] bg-transparent text-[#52766d]"}`}
            >
              <span className="flex items-center gap-2">
                {remindersOn ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <BellRing size={17} />
                )}
                {remindersOn
                  ? isArabic
                    ? "التذكيرات مفعّلة"
                    : "Reminders are on"
                  : isArabic
                    ? "فعّل التذكيرات"
                    : "Turn reminders on"}
              </span>
              <span className="text-xs">
                {remindersOn
                  ? isArabic
                    ? "إيقاف"
                    : "Pause"
                  : isArabic
                    ? "تفعيل"
                    : "Enable"}
              </span>
            </button>
            <div className="mt-4 flex items-center justify-between text-[10px] text-[#82948e]">
              <span>
                {isArabic ? "آخر تحديث متاح الآن" : "Updated just now"}
              </span>
              <button
                type="button"
                onClick={() => void care.refetch()}
                className="flex items-center gap-1 font-semibold text-[#52766d]"
                disabled={care.isFetching}
              >
                <RefreshCw
                  size={12}
                  className={care.isFetching ? "animate-spin" : ""}
                />
                {isArabic ? "تحديث" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-[#dce7df] bg-white p-6 shadow-[0_12px_35px_rgba(24,59,57,.05)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                {isArabic ? "مكتبة النصائح" : "Care library"}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#183b39]">
                {isArabic
                  ? "نصائح بسيطة لكل موسم."
                  : "Simple tips for every season."}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718780]">
                {isArabic
                  ? "خطوات صغيرة تساعدك تهتم بطيرك بشكل أفضل كل يوم."
                  : "Small, practical steps to help you care for your bird every day."}
              </p>
            </div>
            <Link
              href="/notifications"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#52766d]"
            >
              {isArabic ? "كل التنبيهات" : "All alerts"}{" "}
              <CalendarClock size={15} />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tips.map(tip => {
              const Icon = iconFor(tip.icon);
              return (
                <article
                  key={tip.seasonKey}
                  className="group rounded-2xl border border-[#e3ebe4] bg-[#fbfcfa] p-4 transition hover:-translate-y-1 hover:bg-[#f7faf6]"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="grid size-10 place-items-center rounded-xl"
                      style={{
                        backgroundColor: `${tip.accent}20`,
                        color: tip.accent,
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${isInSeason(currentMonth, tip.startMonth, tip.endMonth) ? "bg-[#eaf4ea] text-[#52766d]" : "bg-[#f1f3f0] text-[#a0afa9]"}`}
                    >
                      {isInSeason(currentMonth, tip.startMonth, tip.endMonth)
                        ? isArabic
                          ? "هذا الشهر"
                          : "This month"
                        : monthRange(tip.startMonth, tip.endMonth, isArabic)}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[#183b39]">
                    {isArabic ? tip.titleAr : tip.titleEn}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#718780]">
                    {isArabic ? tip.bodyAr : tip.bodyEn}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function BudgetBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[#b9d8c8]">{label}</span>
        <strong>{value.toLocaleString("ar-EG")} ج.م</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.round((value / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#82948e]">
        {icon}
        {label}
      </span>
      <strong className="mt-1 block text-lg text-[#183b39]">{value}</strong>
    </div>
  );
}
