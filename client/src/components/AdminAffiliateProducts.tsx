import { Edit3, ExternalLink, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AffiliateForm = {
  id: string;
  category: "food" | "care" | "housing";
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceEn: string;
  priceAr: string;
  imageUrl: string;
  affiliateUrl: string;
  noonUrl: string;
  noonCoupon: string;
  tagEn: string;
  tagAr: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = (): AffiliateForm => ({
  id: "",
  category: "food",
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  priceEn: "تحقق من السعر الحالي",
  priceAr: "تحقق من السعر الحالي",
  imageUrl: "/images/bird-seed.jpg",
  affiliateUrl: "",
  noonUrl: "",
  noonCoupon: "",
  tagEn: "Recommended",
  tagAr: "موصى به",
  isActive: true,
  sortOrder: 0,
});

export default function AdminAffiliateProducts() {
  const products = trpc.admin.affiliateProducts.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<AffiliateForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const updateField = <K extends keyof AffiliateForm>(field: K, value: AffiliateForm[K]) =>
    setForm(current => ({ ...current, [field]: value }));
  const create = trpc.admin.createAffiliateProduct.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة منتج الأفلييت");
      setForm(emptyForm());
      setOpen(false);
      void utils.admin.affiliateProducts.invalidate();
      void utils.recommended.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.admin.updateAffiliateProduct.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث رابط الأفلييت");
      setForm(emptyForm());
      setEditingId(null);
      setOpen(false);
      void utils.admin.affiliateProducts.invalidate();
      void utils.recommended.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.admin.deleteAffiliateProduct.useMutation({
    onSuccess: () => {
      toast.success("تم حذف منتج الأفلييت");
      void utils.admin.affiliateProducts.invalidate();
      void utils.recommended.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const startEdit = (product: AffiliateForm) => {
    setEditingId(product.id);
    setForm(product);
    setOpen(true);
  };
  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(false);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nameAr = form.nameAr.trim();
    const generatedId = nameAr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `affiliate-${Date.now()}`;
    const payload = {
      ...form,
      id: form.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") || generatedId,
      nameAr,
      nameEn: form.nameEn.trim() || nameAr,
      descriptionAr: form.descriptionAr.trim() || nameAr,
      descriptionEn: form.descriptionEn.trim() || nameAr,
      imageUrl: form.imageUrl.trim() || "/images/bird-seed.jpg",
      priceAr: form.priceAr.trim() || "تحقق من السعر الحالي",
      priceEn: form.priceEn.trim() || "Check current price",
      tagAr: form.tagAr.trim() || "موصى به",
      tagEn: form.tagEn.trim() || "Recommended",
      noonUrl: form.noonUrl.trim(),
      noonCoupon: form.noonCoupon.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (editingId) update.mutate({ ...payload, id: editingId });
    else create.mutate(payload);
  };

  return (
    <section id="admin-affiliate-products" className="mt-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Affiliate products · روابط الأفلييت</p>
          <h2 className="section-title mt-2 text-3xl">حدّث روابط الشراء<br /><em>بنفسك مباشرة.</em></h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718780]">
            أضف رابط الأفلييت الخاص بك أو عدّله أو أوقف ظهوره. بمجرد الحفظ سيظهر الرابط الجديد في صفحة المنتجات دون تعديل الكود أو نشر نسخة جديدة.
          </p>
        </div>
        <Button type="button" className="cta-primary shrink-0" onClick={startCreate}><Plus size={16} /> إضافة منتج</Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#b9d8c8] bg-[#f7fbf7] p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="eyebrow">{editingId ? "تعديل المنتج" : "منتج جديد"}</p><h3 className="mt-1 font-display text-2xl font-semibold text-[#183b39]">بيانات المنتج والرابط</h3></div>
            <button type="button" className="icon-button" onClick={cancel} aria-label="إغلاق"><X size={17} /></button>
          </div>
          <p className="mt-3 rounded-xl bg-[#eaf1ea] px-4 py-3 text-sm leading-6 text-[#52766d]">للإضافة السريعة اكتب <strong>اسم المنتج بالعربي ورابط أمازون</strong> فقط. باقي البيانات اختيارية ويمكن تعديلها لاحقًا.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="field"><span>المعرّف المختصر · slug <small>(اختياري)</small></span><Input disabled={Boolean(editingId)} value={form.id} onChange={event => updateField("id", event.target.value)} placeholder="يُنشأ تلقائيًا إذا تركته فارغًا" /></label>
            <label className="field"><span>القسم</span><select value={form.category} onChange={event => updateField("category", event.target.value as AffiliateForm["category"])} className="mt-2 h-11 w-full rounded-xl border border-[#dce7df] bg-white px-3 text-sm"><option value="food">غذاء / Food</option><option value="care">رعاية / Care</option><option value="housing">نقل وتجهيز / Housing</option></select></label>
            <label className="field"><span>الاسم بالعربية *</span><Input required value={form.nameAr} onChange={event => updateField("nameAr", event.target.value)} placeholder="خلطة بذور متوازنة" /></label>
            <label className="field"><span>English name <small>(اختياري)</small></span><Input value={form.nameEn} onChange={event => updateField("nameEn", event.target.value)} placeholder="يُستخدم الاسم العربي تلقائيًا" /></label>
            <label className="field"><span>رابط أمازون / Amazon URL *</span><Input required type="url" value={form.affiliateUrl} onChange={event => updateField("affiliateUrl", event.target.value)} placeholder="https://...amazon-affiliate-link..." /></label>
            <label className="field"><span>رابط نون / Noon URL</span><Input type="url" value={form.noonUrl} onChange={event => updateField("noonUrl", event.target.value)} placeholder="https://...noon-affiliate-link..." /></label>
            <label className="field"><span>كود خصم نون / Noon coupon</span><Input value={form.noonCoupon} onChange={event => updateField("noonCoupon", event.target.value)} placeholder="اختياري" /></label>
            <details className="rounded-xl border border-[#dce7df] bg-white p-4 md:col-span-2">
              <summary className="cursor-pointer text-sm font-bold text-[#385a53]">تفاصيل إضافية اختيارية</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="field md:col-span-2"><span>رابط الصورة</span><Input type="text" value={form.imageUrl} onChange={event => updateField("imageUrl", event.target.value)} placeholder="https://... أو /images/bird-seed.jpg" /></label>
                <label className="field"><span>الوصف بالعربية</span><Textarea value={form.descriptionAr} onChange={event => updateField("descriptionAr", event.target.value)} placeholder="وصف مختصر للمنتج" /></label>
                <label className="field"><span>Description in English</span><Textarea value={form.descriptionEn} onChange={event => updateField("descriptionEn", event.target.value)} placeholder="Short product description" /></label>
                <label className="field"><span>السعر الظاهر بالعربية</span><Input value={form.priceAr} onChange={event => updateField("priceAr", event.target.value)} placeholder="تحقق من السعر الحالي" /></label>
                <label className="field"><span>Displayed price in English</span><Input value={form.priceEn} onChange={event => updateField("priceEn", event.target.value)} placeholder="Check current price" /></label>
                <label className="field"><span>التصنيف بالعربية</span><Input value={form.tagAr} onChange={event => updateField("tagAr", event.target.value)} placeholder="رعاية يومية" /></label>
                <label className="field"><span>Tag in English</span><Input value={form.tagEn} onChange={event => updateField("tagEn", event.target.value)} placeholder="Everyday care" /></label>
                <label className="field"><span>ترتيب الظهور</span><Input type="number" min="0" value={form.sortOrder} onChange={event => updateField("sortOrder", Number(event.target.value))} /></label>
                <label className="mt-7 flex items-center gap-2 text-sm font-bold text-[#385a53]"><input type="checkbox" checked={form.isActive} onChange={event => updateField("isActive", event.target.checked)} /> ظاهر للزوار الآن</label>
              </div>
            </details>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={cancel}>إلغاء</Button><Button type="submit" className="bg-[#183b39] text-white hover:bg-[#2e5b55]" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editingId ? "حفظ التعديل" : "إضافة المنتج"}</Button></div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce7df] bg-white">
        {products.isLoading ? <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-[#52766d]" /></div> : products.error ? <div className="p-8 text-center text-sm text-[#bd5941]">تعذر تحميل روابط الأفلييت. جرّب تحديث الصفحة.</div> : products.data?.length ? <div className="divide-y divide-[#edf1ed]">{products.data.map(product => <article key={product.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><img src={product.imageUrl} alt={product.nameAr} className="size-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-xl font-semibold text-[#183b39]">{product.nameAr} <span className="font-sans text-sm text-[#718780]">· {product.nameEn}</span></h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.isActive ? "bg-[#e3f1e5] text-[#38704d]" : "bg-[#f2e7e4] text-[#9d5545]"}`}>{product.isActive ? "ظاهر" : "متوقف"}</span></div><p className="mt-1 break-all text-xs text-[#52766d]">Amazon: {product.affiliateUrl}</p><p className="mt-1 break-all text-xs text-[#f0a52b]">Noon: {product.noonUrl || "لم تتم إضافته بعد"}{product.noonCoupon ? ` · كود: ${product.noonCoupon}` : ""}</p><a className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#52766d] underline" href={product.affiliateUrl} target="_blank" rel="sponsored nofollow noreferrer">فتح رابط أمازون <ExternalLink size={12} /></a></div></div><div className="flex shrink-0 gap-2"><Button type="button" variant="outline" size="sm" onClick={() => startEdit(product)}><Edit3 size={14} /> تعديل</Button><Button type="button" variant="outline" size="sm" className="border-[#e6c7c0] text-[#bd5941] hover:bg-[#fff0eb]" disabled={remove.isPending} onClick={() => { if (window.confirm(`حذف ${product.nameAr}؟`)) remove.mutate({ id: product.id }); }}><Trash2 size={14} /> حذف</Button></div></article>)}</div> : <div className="empty-state m-5"><p>لا توجد منتجات محفوظة في قاعدة البيانات بعد. ابدأ بإضافة أول رابط أفلييت.</p></div>}
      </div>
    </section>
  );
}
