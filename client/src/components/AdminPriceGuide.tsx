import { CalendarDays, Check, Edit3, Loader2, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type PriceGuideForm = {
  id: string;
  birdAr: string;
  birdEn: string;
  range: string;
  sourceAr: string;
  sourceEn: string;
  sourceUrl: string;
  checkedOn: string;
  noteAr: string;
  noteEn: string;
};

const emptyForm = (): PriceGuideForm => ({
  id: "",
  birdAr: "",
  birdEn: "",
  range: "",
  sourceAr: "",
  sourceEn: "",
  sourceUrl: "",
  checkedOn: new Date().toISOString().slice(0, 10),
  noteAr: "",
  noteEn: "",
});

export default function AdminPriceGuide() {
  const guide = trpc.admin.priceGuide.useQuery();
  const drafts = trpc.admin.priceDrafts.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<PriceGuideForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const create = trpc.admin.createPriceGuideItem.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الطائر إلى دليل الأسعار");
      setForm(emptyForm());
      setIsFormOpen(false);
      void utils.admin.priceGuide.invalidate();
      void utils.prices.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.admin.updatePriceGuideItem.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات دليل الأسعار");
      setEditingId(null);
      setForm(emptyForm());
      void utils.admin.priceGuide.invalidate();
      void utils.prices.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.admin.deletePriceGuideItem.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العنصر من دليل الأسعار");
      void utils.admin.priceGuide.invalidate();
      void utils.prices.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const refreshDraft = trpc.admin.refreshPriceDraft.useMutation({
    onSuccess: result => {
      toast.success(`تم تجهيز مسودة الأسعار رقم #${result.draftId} للمراجعة`);
      void drafts.refetch();
    },
    onError: error => toast.error(error.message),
  });

  const approveDraft = trpc.admin.approvePriceDraft.useMutation({ onSuccess: () => { toast.success("تم اعتماد تحديث الأسعار"); void drafts.refetch(); void guide.refetch(); void utils.prices.list.invalidate(); }, onError: error => toast.error(error.message) });
  const rejectDraft = trpc.admin.rejectPriceDraft.useMutation({ onSuccess: () => { toast.success("تم رفض مسودة الأسعار"); void drafts.refetch(); }, onError: error => toast.error(error.message) });
  const isSaving = create.isPending || update.isPending;
  const updateField = (field: keyof PriceGuideForm, value: string) => setForm(current => ({ ...current, [field]: value }));
  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };
  const startEdit = (item: PriceGuideForm) => {
    setEditingId(item.id);
    setForm(item);
    setIsFormOpen(true);
  };
  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(false);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, id: form.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") };
    if (editingId) update.mutate({ ...payload, id: editingId });
    else create.mutate(payload);
  };
  const deleteItem = (id: string, label: string) => {
    if (window.confirm(`حذف ${label} من دليل الأسعار؟`)) remove.mutate({ id });
  };

  return <section id="admin-price-guide-section" aria-labelledby="admin-price-guide" className="mt-12">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">دليل الأسعار · Price guide</p>
        <h2 id="admin-price-guide" className="section-title mt-2 text-3xl">حدّث الأسعار<br /><em>بدون تعديل الكود.</em></h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718780]">أضف الطيور وعدّل النطاقات والمصادر من هنا. التغييرات تُحفظ في قاعدة البيانات وتظهر تلقائيًا في صفحة الأسعار والشريط المتحرك.</p>
      </div>
      <Button type="button" className="cta-primary shrink-0" onClick={startCreate}><Plus size={16} /> إضافة طائر</Button>
    </div>

    <section className="mt-6 rounded-2xl border border-[#ecd9a8] bg-[#fffaf0] p-5" aria-labelledby="price-review-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="eyebrow">تحديث أسبوعي من مصادر خارجية</p><h3 id="price-review-title" className="mt-1 font-display text-2xl font-semibold text-[#183b39]">مسودات الأسعار للمراجعة</h3><p className="mt-2 text-sm leading-6 text-[#718780]">تُجمع الأسعار يوم الجمعة الساعة 5 مساءً، ويمكنك طلب مسودة الآن للاختبار أو المراجعة الفورية.</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f3e5bd] px-3 py-1 text-xs font-bold text-[#765c1d]">{drafts.data?.length ?? 0} قيد المراجعة</span><Button type="button" variant="outline" className="border-[#b9d8c8] text-[#183b39]" disabled={refreshDraft.isPending} onClick={() => refreshDraft.mutate()}>{refreshDraft.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} طلب مراجعة الآن</Button></div></div>
      {drafts.isLoading ? <div className="mt-5"><Loader2 className="animate-spin" /></div> : drafts.data?.length ? <div className="mt-5 space-y-3">{drafts.data.map(draft => <article key={draft.id} className="rounded-xl border border-[#eadfbd] bg-white p-4"><p className="text-sm font-semibold text-[#183b39]">مسودة رقم #{draft.id} · جُمعت في {draft.collectedOn}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#718780]">{draft.sourceSummary}</p><a className="mt-2 inline-block text-xs font-semibold text-[#52766d] underline" href={draft.sourceUrl} target="_blank" rel="noreferrer">فتح المصدر الأساسي</a><div className="mt-4 flex flex-wrap gap-2"><Button type="button" className="bg-[#183b39] text-white" disabled={approveDraft.isPending} onClick={() => { if (window.confirm("اعتماد مسودة الأسعار وتحديث الشريط الآن؟")) approveDraft.mutate({ draftId: draft.id }); }}><Check size={14} /> اعتماد التحديث</Button><Button type="button" variant="outline" className="text-[#bd5941]" disabled={rejectDraft.isPending} onClick={() => { if (window.confirm("رفض مسودة الأسعار؟")) rejectDraft.mutate({ draftId: draft.id, reason: "رفضها المسؤول بعد المراجعة" }); }}><X size={14} /> رفض</Button></div></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-[#d8c98f] p-4 text-sm text-[#718780]">لا توجد مسودة جديدة حاليًا.</div>}
    </section>

    {isFormOpen && <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#b9d8c8] bg-[#f7fbf7] p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="eyebrow">{editingId ? "تعديل عنصر" : "عنصر جديد"}</p><h3 className="mt-1 font-display text-2xl font-semibold text-[#183b39]">{editingId ? "عدّل بيانات الطائر" : "أضف طائرًا إلى الدليل"}</h3></div>
        <button type="button" className="icon-button" onClick={cancelForm} aria-label="إغلاق النموذج"><X size={17} /></button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="field"><span>الاسم بالعربية</span><Input required value={form.birdAr} onChange={event => updateField("birdAr", event.target.value)} placeholder="مثال: كناري" /></label>
        <label className="field"><span>English name</span><Input required value={form.birdEn} onChange={event => updateField("birdEn", event.target.value)} placeholder="Example: Canary" /></label>
        <label className="field"><span>النطاق السعري</span><Input required value={form.range} onChange={event => updateField("range", event.target.value)} placeholder="150–600 ج.م" /></label>
        <label className="field"><span>المعرّف المختصر · slug</span><Input required disabled={Boolean(editingId)} value={form.id} onChange={event => updateField("id", event.target.value)} placeholder="canary" /></label>
        <label className="field"><span>المصدر بالعربية</span><Input required value={form.sourceAr} onChange={event => updateField("sourceAr", event.target.value)} placeholder="إعلانات منشورة ومتابعة سوقية" /></label>
        <label className="field"><span>Source in English</span><Input required value={form.sourceEn} onChange={event => updateField("sourceEn", event.target.value)} placeholder="Public listings and market watch" /></label>
        <label className="field md:col-span-2"><span>رابط المصدر</span><Input required type="url" value={form.sourceUrl} onChange={event => updateField("sourceUrl", event.target.value)} placeholder="https://example.com/source" /></label>
        <label className="field"><span>ملاحظة بالعربية</span><Textarea required value={form.noteAr} onChange={event => updateField("noteAr", event.target.value)} placeholder="يتغير السعر حسب اللون والعمر…" /></label>
        <label className="field"><span>Note in English</span><Textarea required value={form.noteEn} onChange={event => updateField("noteEn", event.target.value)} placeholder="Varies by colour, age…" /></label>
        <label className="field"><span className="flex items-center gap-2"><CalendarDays size={14} /> تاريخ المراجعة</span><Input required type="date" value={form.checkedOn} onChange={event => updateField("checkedOn", event.target.value)} /></label>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={cancelForm}>إلغاء</Button><Button type="submit" className="bg-[#183b39] text-white hover:bg-[#2e5b55]" disabled={isSaving}>{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editingId ? "حفظ التعديل" : "إضافة إلى الدليل"}</Button></div>
    </form>}

    <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce7df] bg-white">
      {guide.isLoading ? <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-[#52766d]" /></div> : guide.error ? <div className="p-8 text-center text-sm text-[#bd5941]">تعذر تحميل عناصر دليل الأسعار. جرّب تحديث الصفحة.</div> : guide.data?.length ? <div className="divide-y divide-[#edf1ed]">{guide.data.map(item => <article key={item.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-xl font-semibold text-[#183b39]">{item.birdAr} <span className="font-sans text-sm font-semibold text-[#718780]">· {item.birdEn}</span></h3><span className="rounded-full bg-[#eef5ed] px-3 py-1 text-xs font-bold text-[#183b39]">{item.range}</span></div><p className="mt-2 text-sm text-[#718780]">{item.noteAr} <span className="text-[#a0afa9]">· {item.noteEn}</span></p><p className="mt-2 break-all text-xs text-[#52766d]">{item.sourceAr} · <a className="underline" href={item.sourceUrl} target="_blank" rel="noreferrer">المصدر</a> · راجعه: {item.checkedOn}</p></div><div className="flex shrink-0 gap-2"><Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}><Edit3 size={14} /> تعديل</Button><Button type="button" variant="outline" size="sm" className="border-[#e6c7c0] text-[#bd5941] hover:bg-[#fff0eb]" disabled={remove.isPending} onClick={() => deleteItem(item.id, item.birdAr)}><Trash2 size={14} /> حذف</Button></div></article>)}</div> : <div className="empty-state m-5"><Check size={24} /><p>لا توجد عناصر في دليل الأسعار بعد.</p></div>}
    </div>
  </section>;
}
