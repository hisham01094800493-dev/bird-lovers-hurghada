import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  Bell,
  Bird,
  Calculator,
  Heart,
  ImageIcon,
  Languages,
  LogIn,
  MapPinned,
  Share2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  ShieldAlert,
  Siren,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ADMIN_EMAIL } from "@shared/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import AppVersionCard from "@/components/AppVersionCard";
import PriceTicker from "@/components/PriceTicker";

const FACEBOOK_GROUP_URL =
  "https://www.facebook.com/groups/798363001904219/?ref=share_group_link";
const DESKTOP_SIDEBAR_KEY = "bird-lovers-desktop-sidebar-collapsed";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, isArabic, toggleLanguage, t } = useLanguage();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const notifications = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const isAdmin = user?.role === "admin" || user?.email === ADMIN_EMAIL;
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(DESKTOP_SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const newestNotificationId = useRef<number | null>(null);
  useEffect(() => {
    if (!notificationMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [notificationMenuOpen]);
  useEffect(() => {
    const newest = notifications.data?.find(
      item =>
        (item.type === "new_message" || item.type === "app_update") &&
        !item.readAt
    );
    if (!newest) return;
    if (newestNotificationId.current === null) {
      newestNotificationId.current = newest.id;
      return;
    }
    if (newest.id <= newestNotificationId.current) return;
    newestNotificationId.current = newest.id;
    const isUpdate = newest.type === "app_update";
    toast.info(
      isUpdate
        ? isArabic
          ? "تحديث جديد للتطبيق"
          : "A new app update is available"
        : isArabic
          ? "وصلتك رسالة جديدة"
          : "You have a new message",
      {
        description: newest.body,
        action: {
          label: isArabic ? "فتح" : "Open",
          onClick: () => {
            window.location.assign(
              newest.link || (isUpdate ? "/notifications" : "/messages")
            );
          },
        },
      }
    );
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    )
      new Notification(
        isUpdate
          ? isArabic
            ? "تحديث جديد للتطبيق"
            : "New app update"
          : isArabic
            ? "رسالة جديدة"
            : "New message",
        { body: newest.body }
      );
  }, [notifications.data, isArabic]);
  const nav = [
    { href: "/marketplace", label: t("marketplace"), icon: Search },
    {
      href: "/community",
      label: isArabic ? "مجتمع الهواة" : "Bird Lovers Community",
      icon: Users,
    },
    { href: "/favorites", label: t("saved"), icon: Heart },
    { href: "/messages", label: t("messages"), icon: MessageCircle },
    { href: "/profile", label: t("profile"), icon: UserRound },
    {
      href: "/care-tools",
      label: isArabic ? "حاسبة ورعاية" : "Care tools",
      icon: Calculator,
    },
    {
      href: "/directory",
      label: isArabic ? "الدليل" : "Directory",
      icon: MapPinned,
    },
    {
      href: "/recommended",
      label: isArabic ? "اختياراتنا" : "Recommended",
      icon: ShoppingBag,
    },
    {
      href: "/lost-found",
      label: isArabic ? "مين تايه؟" : "Lost & found",
      icon: Siren,
    },
    {
      href: "/my-listings",
      label: isArabic ? "إعلاناتي" : "My listings",
      icon: ImageIcon,
    },
  ];
  const switchLanguage = () => {
    toggleLanguage();
    setMenuOpen(false);
  };
  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(current => {
      const next = !current;
      try {
        localStorage.setItem(DESKTOP_SIDEBAR_KEY, String(next));
      } catch {
        // Keep the current session usable when storage is unavailable.
      }
      return next;
    });
  };
  const shareApp = async () => {
    const shareData = {
      title: isArabic ? "Bird Lovers في الغردقة" : "Bird Lovers Hurghada",
      text: isArabic
        ? "اكتشف إعلانات الطيور ومجتمع محبي الطيور في الغردقة"
        : "Discover bird listings and the local bird-lovers community in Hurghada",
      url: window.location.origin,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(isArabic ? "تم نسخ رابط التطبيق" : "App link copied");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError")
        toast.error(
          isArabic ? "تعذرت مشاركة التطبيق" : "Could not share the app"
        );
    }
  };
  return (
    <div dir={isArabic ? "rtl" : "ltr"} className={`site-shell-root min-h-screen bg-[#f7f5ef] text-[#183b39] ${desktopSidebarCollapsed ? "desktop-sidebar-is-collapsed" : ""}`}>
      <header className="sticky top-0 z-40 border-b border-[#dce7df] bg-[#f7f5ef]/95 backdrop-blur">
        <div className="shell flex h-[74px] items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="brand-mark">
              <img
                src="/icons/bird-lovers-budgie-icon-64.png"
                alt="Bird Lovers"
              />
            </span>
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-semibold leading-none tracking-tight">
                Bird Lovers
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b918d]">
                Hurghada • EG
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link
                href="/profile"
                className="profile-chip hidden sm:flex"
                aria-label={isArabic ? "الملف الشخصي" : "Profile"}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  <UserRound size={16} />
                )}
              </Link>
            )}
            <button
              type="button"
              className="icon-button mobile-header-share hidden md:inline-flex"
              onClick={shareApp}
              aria-label={isArabic ? "مشاركة التطبيق" : "Share app"}
              title={isArabic ? "مشاركة التطبيق" : "Share app"}
            >
              <Share2 size={18} />
            </button>
            <div className="relative" ref={notificationMenuRef}>
              <button
                type="button"
                className={`relative grid size-11 place-items-center rounded-xl border border-[#dce7df] bg-white text-[#183b39] transition hover:bg-[#eef5ed] ${location.startsWith("/notifications") ? "ring-2 ring-[#76a68f]/40" : ""}`}
                aria-label={t("notifications")}
                title={t("notifications")}
                aria-expanded={notificationMenuOpen}
                aria-controls="notification-menu"
                onClick={() => setNotificationMenuOpen(open => !open)}
              >
                <Bell size={19} />
                {Boolean(unread.data) && (
                  <span className="notification-dot">
                    {(unread.data ?? 0) > 99 ? "99+" : unread.data}
                  </span>
                )}
              </button>
              {notificationMenuOpen && (
                <div
                  id="notification-menu"
                  role="region"
                  aria-label={t("notifications")}
                  className="absolute end-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-[#315a54] bg-[#183b39] text-white shadow-[0_18px_45px_rgba(24,59,57,.28)]"
                >
                  <div className="flex items-center justify-between border-b border-[#315a54] px-4 py-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-white">
                        {t("notifications")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#b9d8c8]">
                        {isArabic ? "آخر التنبيهات" : "Latest alerts"}
                      </p>
                    </div>
                    {Boolean(unread.data) && (
                      <span className="rounded-full bg-[#faece8] px-2 py-1 text-[10px] font-bold text-[#bd5941]">
                        {isArabic ? `${unread.data} جديد` : `${unread.data} new`}
                      </span>
                    )}
                  </div>
                  <div className="max-h-[340px] overflow-y-auto p-2">
                    {notifications.isLoading ? (
                      <p className="px-3 py-8 text-center text-sm text-[#b9d8c8]">
                        {isArabic ? "جارٍ تحميل التنبيهات…" : "Loading alerts…"}
                      </p>
                    ) : notifications.data?.length ? (
                      notifications.data.slice(0, 5).map(item => (
                        <Link
                          key={item.id}
                          href={item.link || "/notifications"}
                          onClick={() => setNotificationMenuOpen(false)}
                          className={`block rounded-xl px-3 py-3 transition hover:bg-[#285651] ${item.readAt ? "opacity-65" : "bg-[#285651]"}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="join-icon mt-0.5 size-8 shrink-0 rounded-lg">
                              <Bell size={14} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-xs text-white">
                                {item.type === "app_update" && isArabic
                                  ? "تحديث جديد للموقع"
                                  : item.title}
                              </strong>
                              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#d3e6da]">
                                {item.body}
                              </span>
                              <small className="mt-1.5 block text-[10px] text-[#a9c9ba]">
                                {new Date(item.createdAt).toLocaleString(
                                  isArabic ? "ar-EG" : "en-EG"
                                )}
                              </small>
                            </span>
                            {!item.readAt && (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#d26246]" />
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-8 text-center text-sm text-[#b9d8c8]">
                        {isArabic ? "لا توجد تنبيهات الآن." : "No alerts right now."}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationMenuOpen(false)}
                    className="block border-t border-[#315a54] px-4 py-3 text-center text-xs font-bold text-[#f1d1a4] transition hover:bg-[#285651]"
                  >
                    {isArabic ? "عرض كل الإشعارات" : "View all notifications"}
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              className="language-toggle hidden sm:inline-flex"
              onClick={switchLanguage}
              aria-label={
                language === "en"
                  ? "Switch to Arabic"
                  : "التبديل إلى الإنجليزية"
              }
            >
              <Languages size={15} />
              <span>{t("language")}</span>
            </button>
            <>
              <Link
                href="/my-listings"
                className="sell-button mobile-header-my-listings hidden border border-[#76a68f] bg-white text-[#183b39] sm:inline-flex"
              >
                <ImageIcon size={17} />{" "}
                <span className="hidden sm:inline">
                  {isArabic ? "إعلاناتي" : "My listings"}
                </span>
              </Link>
              <Link href="/sell" className="sell-button">
                <Plus size={17} />{" "}
                <span className="hidden sm:inline">{t("sell")}</span>
                <span className="sm:hidden">{t("sellShort")}</span>
              </Link>
            </>
            {isAuthenticated ? (
              <button
                className="icon-button mobile-header-account hidden sm:flex"
                onClick={() => logout()}
                aria-label={t("logout")}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                className="icon-button mobile-header-account hidden sm:flex"
                onClick={() => startLogin()}
                aria-label={t("login")}
              >
                <LogIn size={18} />
              </button>
            )}
            <button
              className="icon-button lg:hidden"
              onClick={() => setMenuOpen(value => !value)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[#dce7df] bg-[#f7f5ef] px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="nav-link justify-start"
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    className={`nav-icon nav-icon-${href.slice(1).replace("/", "-")}`}
                  >
                    <Icon size={17} />
                  </span>{" "}
                  {label}
                </Link>
              ))}
              <Link
                href="/notifications"
                className="nav-link justify-start"
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-icon nav-icon-bell">
                  <Bell size={17} />
                </span>{" "}
                {t("notifications")}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="nav-link justify-start"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-icon nav-icon-admin">
                    <ShieldAlert size={17} />
                  </span>{" "}
                  {t("admin")}
                </Link>
              )}
              <button
                type="button"
                className="nav-link justify-start"
                onClick={shareApp}
              >
                <span className="nav-icon nav-icon-share">
                  <Share2 size={17} />
                </span>{" "}
                {isArabic ? "مشاركة التطبيق" : "Share app"}
              </button>
              <button
                type="button"
                className="nav-link justify-start"
                onClick={switchLanguage}
              >
                <span className="nav-icon nav-icon-language">
                  <Languages size={17} />
                </span>{" "}
                {t("language")}
              </button>
              <button
                className="nav-link justify-start"
                onClick={() => (isAuthenticated ? logout() : startLogin())}
              >
                <span className="nav-icon nav-icon-account">
                  {isAuthenticated ? <LogOut size={17} /> : <LogIn size={17} />}
                </span>{" "}
                {isAuthenticated ? t("logout") : t("login")}
              </button>
              <div className="mobile-version-card mt-3 border-t border-[#dce7df] pt-3">
                <AppVersionCard />
              </div>
            </div>
          </div>
        )}
      </header>
      <aside className="desktop-sidebar hidden lg:flex" aria-label={isArabic ? "القائمة الرئيسية" : "Main navigation"}>
        <div className="desktop-sidebar-brand">
          <span className="brand-mark"><img src="/icons/bird-lovers-budgie-icon-64.png" alt="" /></span>
          <div className="desktop-sidebar-brand-copy"><strong>{isArabic ? "القائمة الرئيسية" : "Main menu"}</strong><span>{isArabic ? "تنقّل أسهل" : "Easy navigation"}</span></div>
          <button
            type="button"
            className="desktop-sidebar-toggle"
            onClick={toggleDesktopSidebar}
            aria-label={desktopSidebarCollapsed ? (isArabic ? "فتح القائمة الجانبية" : "Expand sidebar") : (isArabic ? "طي القائمة الجانبية" : "Collapse sidebar")}
            title={desktopSidebarCollapsed ? (isArabic ? "فتح القائمة" : "Expand sidebar") : (isArabic ? "طي القائمة" : "Collapse sidebar")}
          >
            {desktopSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <p className="desktop-sidebar-section-label">{isArabic ? "التنقل" : "Navigate"}</p>
        <nav className="desktop-main-nav">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={desktopSidebarCollapsed ? label : undefined} className={`nav-link ${location.startsWith(href) ? "nav-link-active" : ""}`}>
              <span className={`nav-icon nav-icon-${href.slice(1).replace("/", "-")}`}><Icon size={17} /></span>
              <span className="desktop-sidebar-link-label">{label}</span>
            </Link>
          ))}
          <Link href="/notifications" title={desktopSidebarCollapsed ? t("notifications") : undefined} className={`nav-link ${location.startsWith("/notifications") ? "nav-link-active" : ""}`}>
            <span className="nav-icon nav-icon-bell"><Bell size={17} /></span><span className="desktop-sidebar-link-label">{t("notifications")}</span>
          </Link>
          {isAdmin && <Link href="/admin" title={desktopSidebarCollapsed ? t("admin") : undefined} className={`nav-link ${location.startsWith("/admin") ? "nav-link-active" : ""}`}>
            <span className="nav-icon nav-icon-admin"><ShieldAlert size={17} /></span><span className="desktop-sidebar-link-label">{t("admin")}</span>
          </Link>}
        </nav>
        <div className="desktop-sidebar-hint">
          <span className="desktop-sidebar-hint-dot" />
          <span>{isArabic ? "المساحة مرتبة وجاهزة" : "Everything is in order"}</span>
        </div>
      </aside>
      <div className="site-content">
        <PriceTicker />
        <main>{children}</main>
        <footer className="mt-24 border-t border-[#dce7df] bg-[#eef3ed]">
        <div className="shell grid gap-8 py-12 md:grid-cols-[1fr_auto_auto]">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-mark">
                <Bird size={18} />
              </span>
              <span className="font-display text-lg font-semibold">
                Bird Lovers {isArabic ? "في الغردقة" : "in Hurghada"}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#69807b]">
              {t("footerCopy")}
            </p>
          </div>
          <div>
            <p className="eyebrow">{t("exploreFooter")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/marketplace" className="footer-link">
                {t("marketplace")}
              </Link>
              <Link href="/community" className="footer-link">
                {t("community")}
              </Link>
              <Link href="/directory" className="footer-link">
                {isArabic ? "دليل العيادات والمحلات" : "Clinics & shops directory"}
              </Link>
              <Link href="/recommended" className="footer-link">
                {isArabic ? "المنتجات الموصى بها" : "Recommended products"}
              </Link>
              <Link href="/contact" className="footer-link">
                {isArabic ? "أضف إعلانك أو بياناتك" : "Add your advert or business"}
              </Link>
              <Link href="/sell" className="footer-link">
                {t("postFooter")}
              </Link>
            </div>
          </div>
          <div>
            <p className="eyebrow">{t("roots")}</p>
            <a
              className="footer-link mt-3 block"
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t("facebookGroup")}
            </a>
            <p className="mt-2 max-w-[210px] text-xs leading-5 text-[#82948e]">
              {isArabic
                ? "الجروب يظل المساحة الاجتماعية؛ والتطبيق يجعل الإعلانات أسهل في البحث والمتابعة."
                : "The group stays the social hub; this app makes listings easier to find and safer to follow up."}
            </p>
          </div>
        </div>
        <div className="shell flex flex-col gap-2 border-t border-[#dce7df] py-5 text-xs text-[#82948e] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © 2026 Bird Lovers Hurghada{" "}
            <span className="mx-1 text-[#b2c1ba]">•</span>{" "}
            <span className="font-semibold text-[#52766d]">
              Developer: Hisham
            </span>
          </span>
          <span>
            {isArabic
              ? "صُنع للطيور وبواسطة المجتمع."
              : "Built for the birds, by the community."}
          </span>
        </div>
        </footer>
      </div>
    </div>
  );
}
