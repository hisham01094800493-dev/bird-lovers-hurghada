import { useEffect, useState } from "react";

const SPLASH_SEEN = "bird-lovers-splash-seen";

export default function BrandSplash() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem(SPLASH_SEEN) !== "1");
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => { sessionStorage.setItem(SPLASH_SEEN, "1"); setVisible(false); }, 1100);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return <div className="brand-splash" role="status" aria-label="Loading Bird Lovers"><img src="/manus-storage/bird-lovers-splash_65a5fb44.png" alt="Bird Lovers" /></div>;
}
