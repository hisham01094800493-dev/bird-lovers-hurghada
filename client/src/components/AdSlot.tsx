import { useEffect } from "react";

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID?.trim();

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ variant = "banner" }: { variant?: "banner" | "compact" }) {
  const hasAdSense = Boolean(ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID);

  useEffect(() => {
    if (!hasAdSense) return;
    const scriptId = "google-adsense-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and restricted browsers can prevent the ad from loading.
    }
  }, [hasAdSense]);

  return (
    <aside className={`ad-slot ad-slot-${variant}`} aria-label="Advertisement">
      {hasAdSense ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: variant === "compact" ? 70 : 90 }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-slot-placeholder">
          <span>مساحة إعلانية</span>
          <small>يمكن تفعيل الإعلانات بإضافة معرّف الناشر لاحقًا</small>
        </div>
      )}
    </aside>
  );
}
