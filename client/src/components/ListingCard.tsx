import { Link } from "wouter";
import { Heart, MapPin, Repeat2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export type ListingCardData = {
  id: number;
  titleEn: string;
  titleAr: string | null;
  descriptionEn?: string;
  price: string | number;
  currency: string;
  negotiable: boolean;
  exchangeAvailable: boolean;
  location: string;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  coverImage: string | null;
  favoritesCount?: number;
};

export default function ListingCard({ listing, compact = false }: { listing: ListingCardData; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const toggle = trpc.favorites.toggle.useMutation({
    onSuccess: data => {
      toast.success(data.favorited ? "Saved to your favourites" : "Removed from saved items");
      utils.favorites.status.invalidate({ listingId: listing.id });
      utils.listings.byId.invalidate({ id: listing.id });
    },
    onError: error => toast.error(error.message),
  });
  const status = trpc.favorites.status.useQuery({ listingId: listing.id }, { enabled: isAuthenticated });
  const price = Number(listing.price).toLocaleString("en-EG");
  return (
    <article className={`listing-card ${compact ? "listing-card-compact" : ""}`}>
      <Link href={`/listing/${listing.id}`} className="group block">
        <div className="listing-image-wrap">
          {listing.coverImage ? <img src={listing.coverImage} alt={listing.titleEn} className="listing-image" /> : <div className="listing-image-placeholder"><span>🦜</span></div>}
          <div className="absolute left-3 top-3 flex gap-2"><span className="pill pill-light">{listing.categoryNameEn || "Birds"}</span>{listing.exchangeAvailable && <span className="pill pill-accent"><Repeat2 size={12} /> Exchange</span>}</div>
          <div className="absolute bottom-3 left-3 rounded-lg bg-[#183b39]/90 px-3 py-1.5 text-sm font-semibold text-white">{price} <span className="text-[10px] font-medium opacity-70">{listing.currency}</span></div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3"><Link href={`/listing/${listing.id}`} className="min-w-0"><h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-[#183b39] group-hover:text-[#d26246]">{listing.titleEn}</h3>{listing.titleAr && <p dir="rtl" className="mt-1 line-clamp-1 text-sm text-[#83918c]">{listing.titleAr}</p>}</Link><Button variant="ghost" size="icon" className={`shrink-0 rounded-full ${status.data ? "text-[#d26246]" : "text-[#9aaca5]"}`} onClick={event => { event.preventDefault(); if (!isAuthenticated) { toast.info("Log in to save listings"); return; } toggle.mutate({ listingId: listing.id }); }} aria-label="Save listing"><Heart size={18} fill={status.data ? "currentColor" : "none"} /></Button></div>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#7a9089]"><span className="flex items-center gap-1"><MapPin size={13} /> {listing.location}</span><span className="flex items-center gap-1"><Tag size={13} /> {listing.negotiable ? "Negotiable" : "Fixed price"}</span></div>
      </div>
    </article>
  );
}
