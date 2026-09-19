import { Heart, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";
import ListingCard from "@/components/ListingCard";

export default function Favorites() {
  const { isAuthenticated, loading } = useAuth();
  const saved = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  if (loading) return <SiteShell><div className="shell py-24 text-center">Loading your saved items…</div></SiteShell>;
  return <SiteShell><section className="shell page-hero"><div><p className="eyebrow">Your collection / مجموعتك</p><h1 className="page-title">Saved for<br /><em>later.</em></h1><p className="page-lede">Keep the listings that made you pause in one quiet place.</p></div></section><section className="shell pb-20">{!isAuthenticated ? <div className="auth-card"><span className="brand-mark mx-auto"><Heart size={20} /></span><h2 className="mt-5 font-display text-2xl font-semibold">Your saved items live here.</h2><p className="mt-3 text-sm leading-6 text-[#718780]">Log in to save listings and come back to them when the time is right.</p><Button className="cta-primary mt-6" onClick={() => startLogin()}><LogIn size={16} /> Log in securely</Button></div> : saved.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-80 animate-pulse rounded-2xl bg-[#eaf1ea]" />)}</div> : saved.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{saved.data.map(item => <ListingCard key={item.id} listing={{ ...item, titleAr: item.titleAr || null, negotiable: false, exchangeAvailable: false, categoryNameEn: item.categoryNameEn, categoryNameAr: item.categoryNameAr, favoritesCount: 0 }} />)}</div> : <div className="empty-state"><Heart size={30} /><h3 className="font-display text-lg font-semibold">Nothing saved yet.</h3><p>When a listing feels right, tap the heart.</p><Link href="/marketplace" className="text-link mt-2 inline-flex">Explore listings <span>→</span></Link></div>}</section></SiteShell>;
}
