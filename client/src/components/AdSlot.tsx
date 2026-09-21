import { ArrowRight, Bird, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
const ADSENSE_SLOT_1 = import.meta.env.VITE_ADSENSE_SLOT_1?.trim() || import.meta.env.VITE_ADSENSE_SLOT_ID?.trim();
const ADSENSE_SLOT_2 = import.meta.env.VITE_ADSENSE_SLOT_2?.trim() || ADSENSE_SLOT_1;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  variant?: "banner" | "compact";
  title?: string;
  description?: string;
  cta?: string;
  href?: string;
  image?: string;
  imageAlt?: string;
};

export default function AdSlot({ variant = "banner", title, description, cta, href = "/sell", image, imageAlt }: AdSlotProps) {
  const slotId = variant === "banner" ? ADSENSE_SLOT_1 : ADSENSE_SLOT_2;
  const hasAdSense = Boolean(ADSENSE_CLIENT_ID && slotId);

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
  }, [hasAdSense, slotId]);

  return (
    <aside className={`ad-slot ad-slot-${variant}`} aria-label="Advertisement">
      {hasAdSense ? (
        <ins className="adsbygoogle" style={{ display: "block", minHeight: variant === "compact" ? 70 : 90 }} data-ad-client={ADSENSE_CLIENT_ID} data-ad-slot={slotId} data-ad-format="auto" data-full-width-responsive="true" />
      ) : (
        <div className="ad-promo">
          <img className="ad-promo-image" src={image || "/images/hurghada-parrot-hero.jpg"} alt={imageAlt || "Colourful bird"} />
          <div className="ad-promo-copy"><strong>{title || "انضم إلى مجتمع طيور الغردقة"}</strong><span>{description || "شارك، اسأل، واعثر على بيت أفضل لطيرك."}</span></div>
          <Link href={href} className="ad-promo-cta">{cta || "انضم الآن"} <ArrowRight size={15} /></Link>
          <span className="ad-promo-badge">{variant === "compact" ? <Bird size={15} /> : <Sparkles size={15} />}</span>
        </div>
      )}
    </aside>
  );
}
