import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "ar";

type Dictionary = Record<string, string>;
const translations: Record<Language, Dictionary> = {
  en: {
    marketplace: "Marketplace", community: "Community", saved: "Saved", messages: "Messages", profile: "Profile", notifications: "Notifications", admin: "Admin", sell: "Sell an item", sellShort: "Sell", login: "Log in", logout: "Log out", language: "العربية", home: "Home", explore: "Explore the marketplace", listSell: "List something to sell", postListing: "Post a listing", searchPlaceholder: "Search birds, breeds, supplies...", allCategories: "All categories", filterBy: "Filter by", latestListings: "Latest listings", hurghadaNearby: "Hurghada & nearby", previous: "Previous", next: "Next", clearFilters: "Clear filters", noListings: "No listings found", tryBroader: "Try a broader search or check back soon.", fixedPrice: "Fixed price", negotiable: "Negotiable", exchange: "Exchange", saveListing: "Save listing", loginToSave: "Log in to save listings", footerCopy: "A calmer, safer home for bird lovers, trusted sellers, and curious neighbours across the Red Sea.", exploreFooter: "Explore", roots: "Our roots", facebookGroup: "Join the Facebook group ↗", postFooter: "Post a listing", languageSaved: "Language saved" },
  ar: {
    marketplace: "السوق", community: "المجتمع", saved: "المحفوظات", messages: "الرسائل", profile: "ملفي", notifications: "الإشعارات", admin: "الإدارة", sell: "أضف إعلانًا", sellShort: "أضف", login: "تسجيل الدخول", logout: "تسجيل الخروج", language: "English", home: "الرئيسية", explore: "استكشف السوق", listSell: "أضف إعلانًا للبيع", postListing: "أضف إعلانًا", searchPlaceholder: "ابحث عن طيور أو سلالات أو مستلزمات…", allCategories: "كل الفئات", filterBy: "تصفية حسب", latestListings: "أحدث الإعلانات", hurghadaNearby: "الغردقة والمناطق القريبة", previous: "السابق", next: "التالي", clearFilters: "مسح التصفية", noListings: "لم نجد إعلانات", tryBroader: "جرّب بحثًا أوسع أو عد لاحقًا.", fixedPrice: "سعر ثابت", negotiable: "قابل للتفاوض", exchange: "تبادل", saveListing: "حفظ الإعلان", loginToSave: "سجّل الدخول لحفظ الإعلانات", footerCopy: "مساحة أهدأ وأكثر أمانًا لمحبي الطيور والبائعين الموثوقين والجيران الفضوليين على ساحل البحر الأحمر.", exploreFooter: "اكتشف", roots: "جذورنا", facebookGroup: "انضم إلى جروب فيسبوك ↗", postFooter: "أضف إعلانًا", languageSaved: "تم حفظ اللغة" },
};

interface LanguageContextValue { language: Language; isArabic: boolean; toggleLanguage: () => void; setLanguage: (language: Language) => void; t: (key: string) => string; }
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): Language {
  try { return localStorage.getItem("bird-lovers-language") === "ar" ? "ar" : "en"; } catch { return "en"; }
}
function persistLanguage(language: Language) { try { localStorage.setItem("bird-lovers-language", language); } catch { /* Storage may be blocked; the current session still works. */ } }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage);
  const setLanguage = (next: Language) => { setLanguageState(next); persistLanguage(next); };
  const toggleLanguage = () => setLanguage(language === "en" ? "ar" : "en");
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; document.body.classList.toggle("is-arabic", language === "ar"); }, [language]);
  const value = useMemo(() => ({ language, isArabic: language === "ar", toggleLanguage, setLanguage, t: (key: string) => translations[language][key] || key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error("useLanguage must be used within LanguageProvider"); return context; }
