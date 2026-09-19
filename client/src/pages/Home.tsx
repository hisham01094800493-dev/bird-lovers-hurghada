import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Bird, ChevronRight, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";
import ListingCard from "@/components/ListingCard";

const categoryArt: Record<string, string> = { birds: "🦜", pets: "🐾", cages: "🏡", food: "🌾", accessories: "🪶", other: "✦" };

export default function Home() {
  const categories = trpc.categories.list.useQuery();
  const listings = trpc.listings.list.useQuery({ limit: 6, offset: 0 });
  const posts = trpc.community.list.useQuery();
  return <SiteShell>
    <section className="shell hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow flex items-center gap-2"><span className="eyebrow-dot" /> Hurghada's bird community / مجتمع الطيور</div>
          <h1 className="hero-title">A better home for<br /><span className="hero-accent">good birds</span> & good people.</h1>
          <p className="hero-lede">Find a feathered friend, trade with confidence, and learn from neighbours who care as much as you do.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/marketplace"><Button className="cta-primary">Explore the marketplace <ArrowRight size={17} /></Button></Link><Link href="/sell"><Button variant="outline" className="cta-secondary">List something to sell <Sparkles size={16} /></Button></Link></div>
          <div className="mt-10 flex flex-wrap gap-5 text-xs font-medium text-[#6d8580]"><span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#76a68f]" /> Community-reviewed</span><span className="flex items-center gap-2"><BadgeCheck size={17} className="text-[#76a68f]" /> Hurghada-first</span><span className="flex items-center gap-2"><MessageCircle size={17} className="text-[#d26246]" /> Real conversations</span></div>
        </div>
        <div className="hero-visual"><div className="hero-orb" /><div className="hero-photo-main"><img src="/manus-storage/parrot-colorful_7df04b3c.jpg" alt="Colourful parrot" /></div><div className="hero-photo-small"><img src="/manus-storage/parakeet-hand_a5b3663f.jpg" alt="Parakeet with a bird lover" /></div><div className="hero-note"><span className="note-icon"><Heart size={15} fill="currentColor" /></span><span><strong>12 new listings</strong><small>this week in Hurghada</small></span></div><div className="hero-feather">✦</div></div>
      </div>
    </section>
    <section className="shell section-pad pt-0"><div className="section-heading"><div><p className="eyebrow">Browse by feeling / تصفّح حسب احتياجك</p><h2 className="section-title">Start with what<br /><em>you need.</em></h2></div><Link href="/marketplace" className="text-link">View all listings <ArrowRight size={16} /></Link></div><div className="category-grid">{categories.isLoading ? [1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />) : categories.data?.map(category => <Link key={category.id} href={`/marketplace?category=${category.id}`} className={`category-card category-${category.accent}`}><span className="category-icon">{categoryArt[category.slug] || "✦"}</span><span className="category-name">{category.nameEn}</span><span dir="rtl" className="category-ar">{category.nameAr}</span><ChevronRight className="category-arrow" size={17} /></Link>)}</div></section>
    <section className="bg-[#eaf1ea] py-20"><div className="shell"><div className="section-heading"><div><p className="eyebrow">Fresh from the neighbourhood / جديد من الحي</p><h2 className="section-title">Lovely birds.<br /><em>Good homes.</em></h2></div><Link href="/marketplace" className="text-link">See the marketplace <ArrowRight size={16} /></Link></div>{listings.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/70" />)}</div> : listings.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.data.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="empty-state"><Bird size={30} /><p>No public listings yet. Be the first to share one.</p><Link href="/sell" className="text-link">Post a listing <ArrowRight size={16} /></Link></div>}</div></section>
    <section className="shell section-pad"><div className="community-banner"><div><p className="eyebrow text-[#b9d8c8]">The flock / السرب</p><h2 className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">Questions are better when the whole community can help.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#b5cec1]">Ask about care, nutrition, breeding or anything bird-shaped. Good advice travels.</p><Link href="/community" className="mt-7 inline-flex text-sm font-semibold text-[#f1d1a4]">Visit the community <ArrowRight size={16} /></Link></div><div className="community-stats"><div className="stat-orbit"><Users size={28} /><strong>{posts.data?.length || 0}</strong><span>fresh discussions</span></div><div className="stat-quote">“Small questions<br /><em>make better homes.</em>”</div></div></div></section>
    <section className="shell pb-20"><div className="join-strip"><div className="flex items-center gap-4"><span className="join-icon"><MapPin size={20} /></span><div><p className="font-semibold text-[#183b39]">Made for Hurghada, ready for the Red Sea.</p><p className="mt-1 text-sm text-[#758a84]">Start local. Grow thoughtfully.</p></div></div><Link href="/sell" className="text-link">Join the flock <ArrowRight size={16} /></Link></div></section>
  </SiteShell>;
}
