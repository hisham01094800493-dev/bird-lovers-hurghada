import { Link } from "wouter";
import { Heart, MapPin, Repeat2, Share2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export type ListingCardData = { id: number; titleEn: string; titleAr: string | null; descriptionEn?: string; price: string | number; currency: string; negotiable: boolean; exchangeAvailable: boolean; location: string; categoryNameEn: string | null; categoryNameAr: string | null; coverImage: string | null; favoritesCount?: number; };

function fallbackImage(listing: ListingCardData) {
  if (listing.categoryNameEn === "Cages") return "/images/cage-gold.jpg";
  if (listing.categoryNameEn === "Food") return "/images/bird-seed.jpg";
  if (listing.titleEn.toLowerCase().includes("macaw")) return "/images/hurghada-parrot-hero.jpg";
  return "/images/hurghada-budgie-card.jpg";
}

async function shareListing(listing: ListingCardData, title: string, isArabic: boolean) {
  const url = new URL(`/listing/${listing.id}`, window.location.origin).toString();
  const shareData = { title, text: isArabic ? `شاهد هذا الإعلان على طيور الحب: ${title}` : `See this bird listing on Bird Lovers: ${title}`, url };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, "bird-lovers-facebook-share", "noopener,noreferrer,width=720,height=640");
}

export default function ListingCard({ listing, compact = false }: { listing: ListingCardData; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { isArabic, t } = useLanguage();
  const utils = trpc.useUtils();
  const toggle = trpc.favorites.toggle.useMutation({ onSuccess: data => { toast.success(data.favorited ? (isArabic ? "تم حفظ الإعلان" : "Saved to your favourites") : (isArabic ? "تمت إزالة الإعلان من المحفوظات" : "Removed from saved items")); utils.favorites.status.invalidate({ listingId: listing.id }); utils.listings.byId.invalidate({ id: listing.id }); }, onError: error => toast.error(error.message) });
  const status = trpc.favorites.status.useQuery({ listingId: listing.id }, { enabled: isAuthenticated });
  const price = Number(listing.price).toLocaleString(isArabic ? "ar-EG" : "en-EG");
  const title = isArabic && listing.titleAr ? listing.titleAr : listing.titleEn;
  const category = isArabic ? (listing.categoryNameAr || listing.categoryNameEn || "طيور") : (listing.categoryNameEn || "Birds");
  return <article className={`listing-card ${compact ? "listing-card-compact" : ""}`}><Link href={`/listing/${listing.id}`} className="group block"><div className="listing-image-wrap">{listing.coverImage ? <img src={listing.coverImage} alt={title} className="listing-image" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage(listing); }} /> : <img src={fallbackImage(listing)} alt={title} className="listing-image" />}<div className="absolute left-3 top-3 flex flex-wrap gap-2"><span className="pill pill-light">{category}</span>{listing.coverImage?.startsWith("/images/listing-") && <span className="pill bg-white/95 text-[#526d65]">{isArabic ? "صورة توضيحية للنوع" : "Species reference photo"}</span>}{listing.exchangeAvailable && <span className="pill pill-accent"><Repeat2 size={12} /> {t("exchange")}</span>}</div><div className="absolute bottom-3 left-3 rounded-lg bg-[#183b39]/90 px-3 py-1.5 text-sm font-semibold text-white">{price} <span className="text-[10px] font-medium opacity-70">{isArabic ? "ج.م" : listing.currency}</span></div></div></Link><div className="p-4"><div className="flex items-start justify-between gap-3"><Link href={`/listing/${listing.id}`} className="min-w-0"><h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-[#183b39] group-hover:text-[#d26246]">{title}</h3>{!isArabic && listing.titleAr && <p dir="rtl" className="mt-1 line-clamp-1 text-sm text-[#83918c]">{listing.titleAr}</p>}</Link><Button variant="ghost" size="icon" className={`shrink-0 rounded-full ${status.data ? "text-[#d26246]" : "text-[#9aaca5]"}`} onClick={event => { event.preventDefault(); if (!isAuthenticated) { toast.info(t("loginToSave")); return; } toggle.mutate({ listingId: listing.id }); }} aria-label={t("saveListing")}><Heart size={18} fill={status.data ? "currentColor" : "none"} /></Button></div><div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#7a9089]"><span className="flex items-center gap-1"><MapPin size={13} /> {listing.location}</span><span className="flex items-center gap-1"><Tag size={13} /> {listing.negotiable ? t("negotiable") : t("fixedPrice")}</span><Button type="button" variant="ghost" size="icon" className="listing-share-button shrink-0 rounded-full text-[#6f8580]" onClick={() => { void shareListing(listing, title, isArabic); }} aria-label={isArabic ? "مشاركة الإعلان على فيسبوك" : "Share listing on Facebook"} title={isArabic ? "مشاركة الإعلان" : "Share listing"}><Share2 size={16} /></Button></div></div></article>;
}
