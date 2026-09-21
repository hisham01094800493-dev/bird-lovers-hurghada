import { RefreshCw, Sparkles, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export const APP_VERSION = "1.1.0";
const UPDATE_COMPLETED_KEY = `bird-lovers-update-completed-${APP_VERSION}`;

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallWindow = Window & { __birdLoversInstallPrompt?: InstallPromptEvent };

export default function AppVersionCard() {
  const { isArabic } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => { event.preventDefault(); const prompt = event as InstallPromptEvent; (window as InstallWindow).__birdLoversInstallPrompt = prompt; setInstallPrompt(prompt); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); delete (window as InstallWindow).__birdLoversInstallPrompt; toast.success(isArabic ? "تم تثبيت التطبيق بنجاح" : "App installed successfully"); };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstallPrompt((window as InstallWindow).__birdLoversInstallPrompt ?? null);
    setUpdateComplete(window.localStorage.getItem(UPDATE_COMPLETED_KEY) === "true");
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, [isArabic]);

  const installNow = async () => {
    if (installed) { toast.info(isArabic ? "التطبيق مثبت بالفعل على جهازك" : "The app is already installed"); return; }
    if (!installPrompt) { toast.info(isArabic ? "افتح قائمة Chrome ثم اختر إضافة إلى الشاشة الرئيسية" : "Open the Chrome menu and choose Add to Home screen"); return; }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") { setInstallPrompt(null); setInstalled(true); }
    } catch {
      toast.info(isArabic ? "افتح قائمة المتصفح واختر إضافة إلى الشاشة الرئيسية" : "Open the browser menu and choose Add to Home screen");
    }
  };

  const updateNow = async () => {
    setUpdating(true);
    try {
      if ("serviceWorker" in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map(registration => registration.update())); }
      if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.filter(key => key.startsWith("bird-lovers-shell")).map(key => caches.delete(key))); }
      window.localStorage.setItem(UPDATE_COMPLETED_KEY, "true");
      setUpdateComplete(true);
    } finally { window.location.reload(); }
  };

  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce7df] bg-white/70 px-4 py-3 text-xs text-[#718780]"><span className="flex items-center gap-2"><Sparkles size={15} className="text-[#d26246]" /><span>{isArabic ? `إصدار التطبيق ${APP_VERSION}` : `App version ${APP_VERSION}`}</span></span><div className="flex flex-wrap items-center gap-2">{!installed && <Button type="button" variant="outline" size="sm" onClick={installNow} className="rounded-xl border-[#d26246] text-[#a94e39]"><Download size={14} /> {isArabic ? "تثبيت التطبيق" : "Install app"}</Button>}{!updateComplete && <Button type="button" variant="outline" size="sm" onClick={updateNow} disabled={updating} className="rounded-xl border-[#76a68f] text-[#183b39]">{updating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} {isArabic ? "تحديث الآن" : "Update now"}</Button>}</div></div>;
}
