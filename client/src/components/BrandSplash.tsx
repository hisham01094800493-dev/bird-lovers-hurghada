import { useEffect, useState } from "react";

const SPLASH_SEEN = "bird-lovers-splash-seen";

function hasSeenSplash() {
  try { return sessionStorage.getItem(SPLASH_SEEN) === "1"; } catch { return false; }
}

function rememberSplash() {
  try { sessionStorage.setItem(SPLASH_SEEN, "1"); } catch { /* Private browsing can block storage; the splash simply shows once per mount. */ }
}

export default function BrandSplash() {
  const [visible, setVisible] = useState(() => !hasSeenSplash());
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => { rememberSplash(); setVisible(false); }, 1100);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return <div className="brand-splash" role="status" aria-label="Loading Bird Lovers"><img src="/images/budgie-main.jpg" alt="Bird Lovers" /></div>;
}
