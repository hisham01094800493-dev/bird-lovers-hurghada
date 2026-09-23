import { useMemo, useState } from "react";
import { BellRing, CalendarClock, CheckCircle2, Feather, Info, ShieldCheck, Sun, ThermometerSun } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const birdTypes = [
  { id: "budgie", ar: "بادجي", en: "Budgie", food: 180, care: 100 },
  { id: "canary", ar: "كناري", en: "Canary", food: 220, care: 120 },
  { id: "lovebird", ar: "فيشر / روز", en: "Lovebird", food: 260, care: 140 },
  { id: "parrot", ar: "ببغاء متوسط", en: "Medium parrot", food: 650, care: 280 },
  { id: "pigeon", ar: "حمام", en: "Pigeon", food: 140, care: 80 },
] as const;

const seasonalTips = [
  { months: [5, 6, 7, 8], icon: ThermometerSun, accent: "#d26246", arTitle: "حر الصيف في الغردقة", enTitle: "Hurghada summer heat", arBody: "غيّر المياه أكثر من مرة يوميًا، وفّر ظلًا وتهوية جيدة، ولا تترك القفص في شمس الظهر.", enBody: "Refresh water more than once daily, provide shade and airflow, and keep cages away from midday sun." },
  { months: [8, 9, 10], icon: Feather, accent: "#76a68f", arTitle: "موسم تغيير الريش", enTitle: "Moulting season", arBody: "قدّم غذاءً متوازنًا ومصدر كالسيوم، وقلّل التوتر وتجنّب الاستحمام البارد أو نقل القفص كثيرًا.", enBody: "Offer a balanced diet and calcium source, reduce stress, and avoid cold baths or frequent cage moves." },
  { months: [1, 2, 3, 4, 5], icon: Sun, accent: "#c49752", arTitle: "فترة التزاوج", enTitle: "Breeding season", arBody: "راقب السلوك والتغذية، ولا تبدأ التفريخ إلا مع زوج سليم ومكان آمن واستعداد للرعاية.", enBody: "Watch behaviour and nutrition, and only start breeding with a healthy pair and a safe setup." },
];

function readReminderPreference() {
  try { return localStorage.getItem("bird-lovers-seasonal-reminders") === "on"; } catch { return false; }
}

export default function CareTools() {
  const { isArabic } = useLanguage();
  const [birdType, setBirdType] = useState("budgie");
  const [count, setCount] = useState(1);
  const [remindersOn, setRemindersOn] = useState(readReminderPreference);
  const selected = birdTypes.find(item => item.id === birdType) ?? birdTypes[0];
  const total = useMemo(() => Math.max(1, count) * (selected.food + selected.care), [count, selected]);
  const currentMonth = new Date().getMonth() + 1;
  const currentTips = seasonalTips.filter(tip => tip.months.includes(currentMonth));

  const toggleReminders = async () => {
    if (!remindersOn && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "denied") { toast.error(isArabic ? "تم رفض إذن التنبيهات من المتصفح" : "Browser notifications were declined"); return; }
    }
    const next = !remindersOn;
    setRemindersOn(next);
    try { localStorage.setItem("bird-lovers-seasonal-reminders", next ? "on" : "off"); } catch { /* local storage may be unavailable */ }
    toast.success(next ? (isArabic ? "تم تفعيل التذكيرات الموسمية" : "Seasonal reminders enabled") : (isArabic ? "تم إيقاف التذكيرات الموسمية" : "Seasonal reminders paused"));
  };

  return <SiteShell>
    <section className="shell page-hero">
      <div><p className="eyebrow flex items-center gap-2"><span className="eyebrow-dot" /> {isArabic ? "أدوات الرعاية" : "Care tools"}</p><h1 className="page-title">{isArabic ? <>خطّط لبيت<br /><em>أفضل لطيرك.</em></> : <>Plan a better<br /><em>home for your bird.</em></>}</h1><p className="page-lede">{isArabic ? "اعرف التكلفة التقريبية، وخليك جاهز للمواسم التي تهم طيورك في الغردقة." : "Estimate the monthly basics and stay ready for the seasons that matter to birds in Hurghada."}</p></div>
      <div className="flex items-center gap-2 rounded-2xl border border-[#dce7df] bg-white px-4 py-3 text-sm text-[#52766d]"><ShieldCheck size={17} />{isArabic ? "تقدير استرشادي" : "Indicative estimate"}</div>
    </section>

    <section className="shell pb-20"><div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
      <div className="form-card">
        <div className="form-card-heading"><span className="join-icon"><Feather size={18} /></span><div><h2>{isArabic ? "حاسبة تكلفة التربية" : "Monthly care calculator"}</h2><p>{isArabic ? "أكل + رعاية أساسية لكل شهر" : "Food + basic care per month"}</p></div></div><div className="mb-5 rounded-xl border border-[#dce7df] bg-[#f7faf6] p-3 text-xs leading-5 text-[#69807b]"><strong className="text-[#315a54]">{isArabic ? "طريقة الاستخدام: " : "How it works: "}</strong>{isArabic ? "اختار نوع الطير، اكتب العدد، وستظهر الميزانية الشهرية التقريبية فورًا." : "Choose the bird type, enter the count, and the estimated monthly budget updates instantly."}</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="field sm:col-span-2"><span>{isArabic ? "نوع الطير" : "Bird type"}</span><select value={birdType} onChange={event => setBirdType(event.target.value)} className="h-11 rounded-xl border bg-[#fbfcfa] px-3 text-sm font-normal text-[#183b39]">{birdTypes.map(item => <option key={item.id} value={item.id}>{isArabic ? item.ar : item.en}</option>)}</select></label>
          <label className="field"><span>{isArabic ? "عدد الطيور" : "Number of birds"}</span><input type="number" min={1} max={50} value={count} onChange={event => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} className="h-11 rounded-xl border bg-[#fbfcfa] px-3 text-sm font-normal text-[#183b39]" /></label>
          <div className="field"><span>{isArabic ? "العملة" : "Currency"}</span><div className="flex h-11 items-center rounded-xl border border-[#d9e5dd] bg-[#fbfcfa] px-3 text-sm font-normal text-[#52766d]">جنيه مصري / EGP</div></div>
        </div>
        <div className="mt-7 rounded-2xl bg-[#183b39] p-5 text-white"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#b9d8c8]">{isArabic ? "التقدير الشهري" : "Monthly estimate"}</p><div className="mt-2 flex items-end justify-between gap-4"><strong className="font-display text-4xl">{total.toLocaleString("ar-EG")} <span className="text-base font-normal text-[#b9d8c8]">ج.م</span></strong><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#e5f0e8]">{count} × {isArabic ? selected.ar : selected.en}</span></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-white/10 p-3"><span className="block text-xs text-[#b9d8c8]">{isArabic ? "أكل" : "Food"}</span><strong>{(selected.food * count).toLocaleString("ar-EG")} ج.م</strong></div><div className="rounded-xl bg-white/10 p-3"><span className="block text-xs text-[#b9d8c8]">{isArabic ? "رعاية أساسية" : "Basic care"}</span><strong>{(selected.care * count).toLocaleString("ar-EG")} ج.م</strong></div></div></div>
        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#82948e]"><Info size={15} className="mt-0.5 shrink-0" />{isArabic ? "التقدير لا يشمل شراء القفص أو الأدوية أو الحالات الطارئة. الأسعار تقريبية وتتغير حسب جودة الأكل وحالة الطير." : "This estimate excludes cages, medicine, and emergencies. Prices vary with food quality and your bird’s condition."}</div>
      </div>

      <div className="rounded-2xl bg-[#eef5ed] p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{isArabic ? "تنبيه موسمي" : "Seasonal alert"}</p><h2 className="mt-2 font-display text-3xl font-semibold text-[#183b39]">{isArabic ? "خليك سابق الموسم." : "Stay one season ahead."}</h2></div><span className="join-icon bg-white"><BellRing size={19} /></span></div><p className="mt-3 text-sm leading-6 text-[#69807b]">{isArabic ? "تظهر لك النصائح المناسبة للوقت الحالي في الغردقة، ويمكنك حفظ تفضيل التذكيرات على جهازك." : "See tips for the current Hurghada season and save your reminder preference on this device."}</p><button type="button" onClick={toggleReminders} className={`mt-5 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${remindersOn ? "border-[#76a68f] bg-white text-[#315a54]" : "border-[#c9dbce] bg-transparent text-[#52766d]"}`}><span className="flex items-center gap-2">{remindersOn ? <CheckCircle2 size={17} /> : <BellRing size={17} />}{remindersOn ? (isArabic ? "التذكيرات مفعّلة" : "Reminders are on") : (isArabic ? "فعّل التذكيرات" : "Turn reminders on")}</span><span className="text-xs">{remindersOn ? (isArabic ? "إيقاف" : "Pause") : (isArabic ? "تفعيل" : "Enable")}</span></button><div className="mt-6 space-y-3">{(currentTips.length ? currentTips : seasonalTips.slice(0, 2)).map(tip => { const Icon = tip.icon; return <article key={tip.arTitle} className="rounded-xl border border-[#dce7df] bg-white p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${tip.accent}18`, color: tip.accent }}><Icon size={18} /></span><div><h3 className="font-semibold text-[#183b39]">{isArabic ? tip.arTitle : tip.enTitle}</h3><p className="mt-1 text-xs leading-5 text-[#718780]">{isArabic ? tip.arBody : tip.enBody}</p></div></div></article>; })}</div><Link href="/notifications" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#52766d]">{isArabic ? "كل التنبيهات" : "All notifications"} <CalendarClock size={15} /></Link></div>
    </div></section>
  </SiteShell>;
}
