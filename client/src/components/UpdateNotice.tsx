import { RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { updateBirdLoversApp } from "@/components/AppVersionCard";

const VERSION_KEY = "bird-lovers-last-seen-version";
const CHECK_INTERVAL = 60_000;

type VersionResponse = { version?: string };

export default function UpdateNotice() {
  const { isArabic } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const checkForUpdate = async () => {
      try {
        const response = await fetch(`/api/version?check=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok) return;
        const data = await response.json() as VersionResponse;
        const version = data.version?.trim();
        if (!version || version === "development" || !active) return;
        const previous = window.localStorage.getItem(VERSION_KEY);
        if (!previous) window.localStorage.setItem(VERSION_KEY, version);
        else if (previous !== version) {
          window.localStorage.setItem(VERSION_KEY, version);
          setAvailable(true);
        }
      } catch {
        // Update detection is optional; the app remains usable when offline.
      }
    };
    checkForUpdate();
    const timer = window.setInterval(checkForUpdate, CHECK_INTERVAL);
    const onVisible = () => { if (document.visibilityState === "visible") checkForUpdate(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  if (!available || dismissed) return null;
  const refresh = async () => { setRefreshing(true); await updateBirdLoversApp(); };
  return <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-xl rounded-2xl border border-[#d7b15d] bg-[#fff9e9] p-3 text-[#183b39] shadow-[0_16px_40px_rgba(24,59,57,.18)] sm:inset-x-5 sm:top-5 sm:p-4" role="status" dir={isArabic ? "rtl" : "ltr"}>
    <button type="button" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-[#6f7f68] hover:bg-[#f3e8c8]" onClick={() => setDismissed(true)} aria-label={isArabic ? "إغلاق الإشعار" : "Dismiss update notice"}><X size={16} /></button>
    <div className="flex items-start gap-3 pr-7">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0d487] text-[#6d5420]"><Sparkles size={18} /></span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{isArabic ? "يتوفر تحديث جديد" : "A new update is available"}</p><p className="mt-1 text-sm leading-5 text-[#66776d]">{isArabic ? "حدّث الصفحة الآن للحصول على آخر التحسينات." : "Refresh the page to get the latest improvements."}</p><Button type="button" size="sm" onClick={refresh} disabled={refreshing} className="mt-3 rounded-xl bg-[#183b39] text-white hover:bg-[#25534f]">{refreshing ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />} {isArabic ? "تحديث الصفحة" : "Refresh page"}</Button></div>
    </div>
  </div>;
}
