import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Edit3, Eye, ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import SiteShell from "@/components/SiteShell";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type ListingImage = { id: number; storagePath: string; sortOrder?: number };
type Listing = { id: number; titleEn: string; titleAr?: string | null; descriptionAr?: string | null; price: string; location: string; status: string; moderationStatus: string; images: ListingImage[] };
type Filter = "all" | "published" | "pending_review" | "archived" | "sold";

const statusLabel: Record<string, { ar: string; en: string; tone: string }> = {
  published: { ar: "منشور", en: "Published", tone: "bg-[#e4f2e7] text-[#39735d]" },
  pending_review: { ar: "قيد المراجعة", en: "Pending review", tone: "bg-[#fff2dc] text-[#9a6d35]" },
  archived: { ar: "مؤرشف", en: "Archived", tone: "bg-[#f0eeee] text-[#786f6c]" },
  sold: { ar: "تم البيع", en: "Sold", tone: "bg-[#e8eef7] text-[#4c6682]" },
  reserved: { ar: "محجوز", en: "Reserved", tone: "bg-[#f7e9e0] text-[#a85e42]" },
};

export default function MyListings() {
  const { isAuthenticated, loading } = useAuth();
  const { isArabic } = useLanguage();
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Listing[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => { const response = await fetch("/api/listings/mine"); if (!response.ok) throw new Error(isArabic ? "تعذر تحميل إعلاناتك" : "Could not load your listings"); setItems(await response.json()); };
  useEffect(() => { if (isAuthenticated) load().catch(error => toast.error(error.message)); }, [isAuthenticated]);

  const remove = async (id: number) => {
    if (!window.confirm(isArabic ? "هل تريد حذف هذا الإعلان نهائياً؟" : "Do you want to permanently delete this listing?")) return;
    setBusy(id);
    try { const response = await fetch(`/api/listings/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error(isArabic ? "تعذر حذف الإعلان" : "Could not delete listing"); setItems(current => current.filter(item => item.id !== id)); toast.success(isArabic ? "تم حذف الإعلان" : "Listing deleted"); }
    catch (error) { toast.error(error instanceof Error ? error.message : (isArabic ? "حدث خطأ" : "Something went wrong")); }
    finally { setBusy(null); }
  };

  const markSold = async (id: number) => {
    if (!window.confirm(isArabic ? "هل تم بيع هذا الإعلان؟" : "Mark this listing as sold?")) return;
    setBusy(id);
    try { const response = await fetch(`/api/listings/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "sold" }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || (isArabic ? "تعذر تحديث حالة الإعلان" : "Could not update listing status")); setItems(current => current.map(item => item.id === id ? { ...item, status: "sold" } : item)); toast.success(isArabic ? "تم تعليم الإعلان كتم البيع" : "Listing marked as sold"); }
    catch (error) { toast.error(error instanceof Error ? error.message : (isArabic ? "حدث خطأ" : "Something went wrong")); }
    finally { setBusy(null); }
  };

  const filteredItems = useMemo(() => filter === "all" ? items : items.filter(item => item.status === filter), [filter, items]);
  const countFor = (value: Filter) => value === "all" ? items.length : items.filter(item => item.status === value).length;

  if (loading) return <SiteShell><div className="shell py-24 text-center"><Loader2 className="mx-auto animate-spin" /></div></SiteShell>;
  if (!isAuthenticated) return <SiteShell><div className="shell py-24"><div className="auth-card"><span className="brand-mark mx-auto"><ImageIcon size={20} /></span><h1 className="mt-5 font-display text-3xl font-semibold">إعلاناتك في مكان واحد</h1><p className="mt-3 text-sm text-[#718780]">سجّل الدخول لإضافة إعلاناتك وتعديلها ومتابعة حالتها.</p><Button className="cta-primary mt-6" onClick={() => startLogin()}>تسجيل الدخول</Button></div></div></SiteShell>;

  return <SiteShell><section className="shell py-10 sm:py-16"><Link href="/profile" className="back-link"><ArrowLeft size={16} /> العودة للملف الشخصي</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">My listings / إعلاناتي</p><h1 className="page-title mt-3">إعلاناتك،<br /><em>بإدارتك.</em></h1><p className="page-lede">تابع صور إعلانك وحالته، وعدّل التفاصيل أو احذفه في أي وقت.</p></div><Button className="cta-primary" onClick={() => navigate("/sell")}><Plus size={16} /> إضافة إعلان</Button></div><div className="mt-9 rounded-2xl border border-[#dce7df] bg-white p-2 shadow-[0_10px_30px_rgba(24,59,57,.04)]"><div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="تصفية الإعلانات">{(["all", "published", "pending_review", "archived", "sold"] as Filter[]).map(value => { const label = value === "all" ? { ar: "كل الإعلانات", en: "All listings" } : statusLabel[value] || { ar: value, en: value }; return <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${filter === value ? "bg-[#183b39] text-white" : "text-[#718780] hover:bg-[#eef5ed]"}`}>{isArabic ? label.ar : label.en} <span className={filter === value ? "text-[#cce5d3]" : "text-[#9aaca5]"}>({countFor(value)})</span></button>; })}</div></div>{filteredItems.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{filteredItems.map(item => { const status = statusLabel[item.status] || { ar: item.status, en: item.status, tone: "bg-[#eef5ed] text-[#557b69]" }; const title = isArabic && item.titleAr ? item.titleAr : item.titleEn; const images = [...(item.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); return <article key={item.id} className="listing-card overflow-hidden"><button type="button" className="group relative block w-full bg-[#eef5ed] text-left" onClick={() => navigate(`/listing/${item.id}`)} aria-label={isArabic ? `عرض ${title}` : `View ${title}`}>{images[0] ? <img src={images[0].storagePath} alt={title} className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <div className="grid h-56 place-items-center text-[#83a095]"><ImageIcon size={38} /></div>}<span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#183b39] shadow-sm">{isArabic ? status.ar : status.en}</span>{images.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-[#183b39]/85 px-3 py-1.5 text-[11px] font-bold text-white">{images.length} {isArabic ? "صور" : "photos"}</span>}</button><div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-display text-xl font-semibold text-[#183b39]">{title}</h2><p className="mt-2 text-sm text-[#718780]">{Number(item.price).toLocaleString(isArabic ? "ar-EG" : "en-EG")} {isArabic ? "ج.م" : "EGP"} · {item.location}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.tone}`}>{isArabic ? status.ar : status.en}</span></div><div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7eee7] pt-4"><Button variant="outline" size="sm" className="rounded-xl border-[#dce7df]" onClick={() => navigate(`/listing/${item.id}`)}><Eye size={15} /> عرض</Button><Button variant="outline" size="sm" className="rounded-xl border-[#dce7df]" onClick={() => navigate(`/listing/${item.id}/edit`)}><Edit3 size={15} /> تعديل</Button>{(item.status === "published" || item.status === "reserved") && <Button variant="outline" size="sm" className="rounded-xl border-[#cfe3d5] text-[#39735d] hover:bg-[#eef8f0]" disabled={busy === item.id} onClick={() => markSold(item.id)}><CheckCircle2 size={15} /> {isArabic ? "تم البيع" : "Sold"}</Button>}<Button variant="outline" size="sm" className="rounded-xl border-[#f0d8d0] text-[#bd5941] hover:bg-[#fff4f0]" disabled={busy === item.id} onClick={() => remove(item.id)}>{busy === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} حذف</Button></div></div></article>; })}</div> : <div className="empty-state mt-6"><ImageIcon size={30} /><h2 className="font-display text-xl font-semibold">{filter === "all" ? "لا توجد إعلانات بعد" : "لا توجد إعلانات بهذه الحالة"}</h2><p>{filter === "all" ? "أضف أول إعلان لك وابدأ استقبال الرسائل." : "جرّب اختيار تبويب آخر لمشاهدة إعلاناتك."}</p><Button className="cta-primary mt-4" onClick={() => filter === "all" ? navigate("/sell") : setFilter("all")}>{filter === "all" ? "أنشئ أول إعلان" : "عرض كل الإعلانات"}</Button></div>}</section></SiteShell>;
}
