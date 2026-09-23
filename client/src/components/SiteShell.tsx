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
  Share2,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
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
  const newestNotificationId = useRef<number | null>(null);
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
    <div className="min-h-screen bg-[#f7f5ef] text-[#183b39]">
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
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${location.startsWith(href) ? "nav-link-active" : ""}`}
              >
                <span className="nav-icon nav-icon-primary">
                  <Icon size={16} />
                </span>{" "}
                <span>{label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`nav-link ${location.startsWith("/admin") ? "nav-link-active" : ""}`}
                aria-label={t("admin")}
              >
                <ShieldAlert size={16} />
              </Link>
            )}
          </nav>
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
              className="icon-button"
              onClick={shareApp}
              aria-label={isArabic ? "مشاركة التطبيق" : "Share app"}
              title={isArabic ? "مشاركة التطبيق" : "Share app"}
            >
              <Share2 size={18} />
            </button>
            <Link
              href="/notifications"
              className={`relative grid size-11 place-items-center rounded-xl border border-[#dce7df] bg-white text-[#183b39] transition hover:bg-[#eef5ed] ${location.startsWith("/notifications") ? "ring-2 ring-[#76a68f]/40" : ""}`}
              aria-label={t("notifications")}
              title={t("notifications")}
            >
              <Bell size={19} />
              {Boolean(unread.data) && (
                <span className="notification-dot">
                  {(unread.data ?? 0) > 99 ? "99+" : unread.data}
                </span>
              )}
            </Link>
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
                className="sell-button border border-[#76a68f] bg-white text-[#183b39]"
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
                className="icon-button hidden sm:flex"
                onClick={() => logout()}
                aria-label={t("logout")}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                className="icon-button hidden sm:flex"
                onClick={() => startLogin()}
                aria-label={t("login")}
              >
                <LogIn size={18} />
              </button>
            )}
            <button
              className="icon-button md:hidden"
              onClick={() => setMenuOpen(value => !value)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            className="mobile-sidebar-overlay"
            onClick={() => setMenuOpen(false)}
          >
            <aside
              className="mobile-sidebar-panel"
              onClick={event => event.stopPropagation()}
            >
              <div className="mobile-sidebar-heading">
                <span className="brand-mark">
                  <img src="/icons/bird-lovers-budgie-icon-64.png" alt="" />
                </span>
                <strong>
                  {isArabic ? "قائمة Bird Lovers" : "Bird Lovers menu"}
                </strong>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mx-auto flex max-w-6xl flex-col gap-1">
                {nav.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="nav-link justify-start"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="nav-icon nav-icon-primary">
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
                  <Bell size={17} /> {t("notifications")}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="nav-link justify-start"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ShieldAlert size={17} /> {t("admin")}
                  </Link>
                )}
                <button
                  type="button"
                  className="nav-link justify-start"
                  onClick={shareApp}
                >
                  <Share2 size={17} />{" "}
                  {isArabic ? "مشاركة التطبيق" : "Share app"}
                </button>
                <button
                  type="button"
                  className="nav-link justify-start"
                  onClick={switchLanguage}
                >
                  <Languages size={17} /> {t("language")}
                </button>
                <button
                  className="nav-link justify-start"
                  onClick={() => (isAuthenticated ? logout() : startLogin())}
                >
                  {isAuthenticated ? <LogOut size={17} /> : <LogIn size={17} />}{" "}
                  {isAuthenticated ? t("logout") : t("login")}
                </button>
                <div className="mobile-version-card mt-3 border-t border-[#dce7df] pt-3">
                  <AppVersionCard />
                </div>
              </div>
            </aside>
          </div>
        )}
      </header>
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
  );
}
