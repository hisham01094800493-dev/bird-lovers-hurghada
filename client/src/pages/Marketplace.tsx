import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Filter, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";
import ListingCard from "@/components/ListingCard";

export default function Marketplace() {
  const [location] = useLocation();
  const queryCategory = new URLSearchParams(location.split("?")[1] || "").get("category");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState(queryCategory || "all");
  const [offset, setOffset] = useState(0);
  const limit = 12;
  const categories = trpc.categories.list.useQuery();
  const listings = trpc.listings.list.useQuery({ search: search || undefined, categoryId: categoryId === "all" ? undefined : Number(categoryId), limit, offset });
  useEffect(() => { const handle = window.setTimeout(() => { setSearch(searchInput); setOffset(0); }, 250); return () => window.clearTimeout(handle); }, [searchInput]);
  return <SiteShell><section className="shell page-hero"><div><p className="eyebrow">Marketplace / السوق</p><h1 className="page-title">Find your next<br /><em>good match.</em></h1><p className="page-lede">Birds, cages, food and small joys — shared by people nearby.</p></div><Link href="/sell"><Button className="cta-primary"><Sparkles size={16} /> Post a listing</Button></Link></section><section className="shell pb-20"><div className="filter-bar"><div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ba19a]" size={18} /><Input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Search birds, breeds, supplies..." className="h-12 rounded-xl border-[#dce7df] bg-white pl-11 text-sm shadow-none focus-visible:ring-[#76a68f]" /></div><div className="hidden items-center gap-2 text-sm text-[#758a84] lg:flex"><SlidersHorizontal size={17} /> Filter by</div><Select value={categoryId} onValueChange={value => { setCategoryId(value); setOffset(0); }}><SelectTrigger className="h-12 w-full rounded-xl border-[#dce7df] bg-white shadow-none sm:w-[200px]"><SelectValue placeholder="All categories" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.data?.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.nameEn} · {category.nameAr}</SelectItem>)}</SelectContent></Select></div>{listings.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-[350px] animate-pulse rounded-2xl bg-[#eaf1ea]" />)}</div> : listings.data?.length ? <><div className="mb-5 flex items-center justify-between text-sm text-[#7b918b]"><span>{search ? `Results for “${search}”` : "Latest listings"}</span><span className="flex items-center gap-2"><Filter size={14} /> Hurghada & nearby</span></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.data.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div><div className="mt-10 flex justify-center gap-3"><Button variant="outline" className="rounded-xl border-[#d1dfd7]" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button><Button variant="outline" className="rounded-xl border-[#d1dfd7]" disabled={listings.data.length < limit} onClick={() => setOffset(offset + limit)}>Next</Button></div></> : <div className="empty-state"><Search size={30} /><h3 className="font-display text-lg font-semibold">No listings found</h3><p>Try a broader search or check back soon.</p><Button variant="outline" className="mt-3 rounded-xl" onClick={() => { setSearchInput(""); setSearch(""); setCategoryId("all"); }}>Clear filters</Button></div>}</section></SiteShell>;
}
