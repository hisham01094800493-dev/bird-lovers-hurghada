import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Bell, Bird, Heart, ImageIcon, Languages, LogIn, LogOut, Menu, MessageCircle, Plus, Search, ShieldAlert, UserRound, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ADMIN_EMAIL } from "@shared/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import AppVersionCard from "@/components/AppVersionCard";
import AdSlot from "@/components/AdSlot";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/798363001904219/?ref=share_group_link";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, isArabic, toggleLanguage, t } = useLanguage();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15000 });
  const notifications = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15000 });
  const isAdmin = user?.role === "admin" || user?.email === ADMIN_EMAIL;
  const [menuOpen, setMenuOpen] = useState(false);
  const newestNotificationId = useRef<number | null>(null);
  useEffect(() => {
    const newest = notifications.data?.find(item => (item.type === "new_message" || item.type === "app_update") && !item.readAt);
    if (!newest) return;
    if (newestNotificationId.current === null) { newestNotificationId.current = newest.id; return; }
    if (newest.id <= newestNotificationId.current) return;
    newestNotificationId.current = newest.id;
    const isUpdate = newest.type === "app_update";
    toast.info(isUpdate ? (isArabic ? "تحديث جديد للتطبيق" : "A new app update is available") : (isArabic ? "وصلتك رسالة جديدة" : "You have a new message"), { description: newest.body, action: { label: isArabic ? "فتح" : "Open", onClick: () => { window.location.assign(newest.link || (isUpdate ? "/notifications" : "/messages")); } } });
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") new Notification(isUpdate ? (isArabic ? "تحديث جديد للتطبيق" : "New app update") : (isArabic ? "رسالة جديدة" : "New message"), { body: newest.body });
  }, [notifications.data, isArabic]);
  const nav = [
    { href: "/marketplace", label: t("marketplace"), icon: Search },
    { href: "/community", label: t("community"), icon: Users },
    { href: "/favorites", label: t("saved"), icon: Heart },
    { href: "/messages", label: t("messages"), icon: MessageCircle },
    { href: "/profile", label: t("profile"), icon: UserRound }, { href: "/my-listings", label: isArabic ? "إعلاناتي" : "My listings", icon: ImageIcon },
  ];
  const switchLanguage = () => { toggleLanguage(); setMenuOpen(false); };
  return <div className="min-h-screen bg-[#f7f5ef] text-[#183b39]"><header className="sticky top-0 z-40 border-b border-[#dce7df] bg-[#f7f5ef]/95 backdrop-blur"><div className="shell flex h-[74px] items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Bird size={20} strokeWidth={2.4} /></span><span className="hidden sm:block"><span className="block font-display text-lg font-semibold leading-none tracking-tight">Bird Lovers</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b918d]">Hurghada • EG</span></span></Link><nav className="hidden items-center gap-1 md:flex">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location.startsWith(href) ? "nav-link-active" : ""}`}><Icon size={16} /> <span>{label}</span></Link>)}{isAdmin && <Link href="/admin" className={`nav-link ${location.startsWith("/admin") ? "nav-link-active" : ""}`} aria-label={t("admin")}><ShieldAlert size={16} /></Link>}</nav><div className="flex items-center gap-2"><Link href="/notifications" className={`relative grid size-11 place-items-center rounded-xl border border-[#dce7df] bg-white text-[#183b39] transition hover:bg-[#eef5ed] ${location.startsWith("/notifications") ? "ring-2 ring-[#76a68f]/40" : ""}`} aria-label={t("notifications")} title={t("notifications")}><Bell size={19} />{Boolean(unread.data) && <span className="notification-dot">{(unread.data ?? 0) > 99 ? "99+" : unread.data}</span>}</Link><button type="button" className="language-toggle hidden sm:inline-flex" onClick={switchLanguage} aria-label={language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}><Languages size={15} /><span>{t("language")}</span></button><><Link href="/my-listings" className="sell-button border border-[#76a68f] bg-white text-[#183b39]"><ImageIcon size={17} /> <span className="hidden sm:inline">{isArabic ? "إعلاناتي" : "My listings"}</span></Link><Link href="/sell" className="sell-button"><Plus size={17} /> <span className="hidden sm:inline">{t("sell")}</span><span className="sm:hidden">{t("sellShort")}</span></Link></>{isAuthenticated ? <button className="icon-button hidden sm:flex" onClick={() => logout()} aria-label={t("logout")}><LogOut size={18} /></button> : <button className="icon-button hidden sm:flex" onClick={() => startLogin()} aria-label={t("login")}><LogIn size={18} /></button>}<button className="icon-button md:hidden" onClick={() => setMenuOpen(value => !value)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></div>{menuOpen && <div className="border-t border-[#dce7df] bg-[#f7f5ef] px-4 py-4 md:hidden"><div className="mx-auto flex max-w-6xl flex-col gap-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-link justify-start" onClick={() => setMenuOpen(false)}><Icon size={17} /> {label}</Link>)}<Link href="/notifications" className="nav-link justify-start" onClick={() => setMenuOpen(false)}><Bell size={17} /> {t("notifications")}</Link>{isAdmin && <Link href="/admin" className="nav-link justify-start" onClick={() => setMenuOpen(false)}><ShieldAlert size={17} /> {t("admin")}</Link>}<button type="button" className="nav-link justify-start" onClick={switchLanguage}><Languages size={17} /> {t("language")}</button><button className="nav-link justify-start" onClick={() => isAuthenticated ? logout() : startLogin()}>{isAuthenticated ? <LogOut size={17} /> : <LogIn size={17} />} {isAuthenticated ? t("logout") : t("login")}</button></div></div>}</header><div className="shell pt-3"><AppVersionCard /><AdSlot variant="compact" title="خليك قريب من السرب" description="سجّل دخولك لتراسل البائعين وتحفظ إعلاناتك المفضلة." cta="سجّل الآن" href="/messages" /></div><main>{children}</main><footer className="mt-24 border-t border-[#dce7df] bg-[#eef3ed]"><div className="shell grid gap-8 py-12 md:grid-cols-[1fr_auto_auto]"><div><div className="flex items-center gap-3"><span className="brand-mark"><Bird size={18} /></span><span className="font-display text-lg font-semibold">Bird Lovers {isArabic ? "في الغردقة" : "in Hurghada"}</span></div><p className="mt-3 max-w-sm text-sm leading-6 text-[#69807b]">{t("footerCopy")}</p></div><div><p className="eyebrow">{t("exploreFooter")}</p><div className="mt-3 flex flex-col gap-2 text-sm"><Link href="/marketplace" className="footer-link">{t("marketplace")}</Link><Link href="/community" className="footer-link">{t("community")}</Link><Link href="/sell" className="footer-link">{t("postFooter")}</Link></div></div><div><p className="eyebrow">{t("roots")}</p><a className="footer-link mt-3 block" href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer">{t("facebookGroup")}</a><p className="mt-2 max-w-[210px] text-xs leading-5 text-[#82948e]">{isArabic ? "الجروب يظل المساحة الاجتماعية؛ والتطبيق يجعل الإعلانات أسهل في البحث والمتابعة." : "The group stays the social hub; this app makes listings easier to find and safer to follow up."}</p></div></div><div className="shell flex flex-col gap-2 border-t border-[#dce7df] py-5 text-xs text-[#82948e] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Bird Lovers Hurghada</span><span>{isArabic ? "صُنع للطيور وبواسطة المجتمع." : "Built for the birds, by the community."}</span></div></footer></div>;
}
