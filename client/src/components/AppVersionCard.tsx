import { RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const APP_VERSION = "1.1.0";

export default function AppVersionCard() {
  const { isArabic } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const updateNow = async () => {
    setUpdating(true);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.update()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("bird-lovers-shell")).map(key => caches.delete(key)));
      }
    } finally {
      window.location.reload();
    }
  };
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce7df] bg-white/70 px-4 py-3 text-xs text-[#718780]"><span className="flex items-center gap-2"><Sparkles size={15} className="text-[#d26246]" /><span>{isArabic ? `إصدار التطبيق ${APP_VERSION}` : `App version ${APP_VERSION}`}</span></span><Button type="button" variant="outline" size="sm" onClick={updateNow} disabled={updating} className="rounded-xl border-[#76a68f] text-[#183b39]">{updating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} {isArabic ? "تحديث الآن" : "Update now"}</Button></div>;
}
