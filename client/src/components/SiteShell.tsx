import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Bird, Heart, LogIn, LogOut, Menu, Plus, Search, Users, X } from "lucide-react";
import { useState } from "react";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/798363001904219/?ref=share_group_link";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { href: "/marketplace", label: "Marketplace", labelAr: "السوق", icon: Search },
    { href: "/community", label: "Community", labelAr: "المجتمع", icon: Users },
    { href: "/favorites", label: "Saved", labelAr: "المحفوظات", icon: Heart },
  ];
  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#183b39]">
      <header className="sticky top-0 z-40 border-b border-[#dce7df] bg-[#f7f5ef]/95 backdrop-blur">
        <div className="shell flex h-[74px] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark"><Bird size={20} strokeWidth={2.4} /></span>
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-semibold leading-none tracking-tight">Bird Lovers</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b918d]">Hurghada • EG</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ href, label, labelAr, icon: Icon }) => (
              <Link key={href} href={href} className={`nav-link ${location.startsWith(href) ? "nav-link-active" : ""}`}>
                <Icon size={16} /> <span>{label}</span><span className="text-xs text-[#94a4a0]">{labelAr}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sell" className="sell-button"><Plus size={17} /> <span className="hidden sm:inline">Sell an item</span><span className="sm:hidden">Sell</span></Link>
            {isAuthenticated ? (
              <button className="icon-button hidden sm:flex" onClick={() => logout()} aria-label="Log out"><LogOut size={18} /></button>
            ) : (
              <button className="icon-button hidden sm:flex" onClick={() => startLogin()} aria-label="Log in"><LogIn size={18} /></button>
            )}
            <button className="icon-button md:hidden" onClick={() => setMenuOpen(value => !value)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-[#dce7df] bg-[#f7f5ef] px-4 py-4 md:hidden"><div className="mx-auto flex max-w-6xl flex-col gap-1">{nav.map(({ href, label, labelAr, icon: Icon }) => <Link key={href} href={href} className="nav-link justify-start" onClick={() => setMenuOpen(false)}><Icon size={17} /> {label} <span className="text-xs text-[#94a4a0]">{labelAr}</span></Link>)}<button className="nav-link justify-start" onClick={() => isAuthenticated ? logout() : startLogin()}>{isAuthenticated ? <LogOut size={17} /> : <LogIn size={17} />} {isAuthenticated ? "Log out" : "Log in"}</button></div></div>}
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[#dce7df] bg-[#eef3ed]">
        <div className="shell grid gap-8 py-12 md:grid-cols-[1fr_auto_auto]">
          <div><div className="flex items-center gap-3"><span className="brand-mark"><Bird size={18} /></span><span className="font-display text-lg font-semibold">Bird Lovers in Hurghada</span></div><p className="mt-3 max-w-sm text-sm leading-6 text-[#69807b]">A calmer, safer home for bird lovers, trusted sellers, and curious neighbours across the Red Sea.</p></div>
          <div><p className="eyebrow">Explore / اكتشف</p><div className="mt-3 flex flex-col gap-2 text-sm"><Link href="/marketplace" className="footer-link">Marketplace</Link><Link href="/community" className="footer-link">Community</Link><Link href="/sell" className="footer-link">Post a listing</Link></div></div>
          <div><p className="eyebrow">Our roots / الجذور</p><a className="footer-link mt-3 block" href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer">Join the Facebook group ↗</a><p className="mt-2 max-w-[210px] text-xs leading-5 text-[#82948e]">The group stays the social hub; this app makes listings easier to find and safer to follow up.</p></div>
        </div>
        <div className="shell flex flex-col gap-2 border-t border-[#dce7df] py-5 text-xs text-[#82948e] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Bird Lovers Hurghada</span><span>Built for the birds, by the community.</span></div>
      </footer>
    </div>
  );
}
