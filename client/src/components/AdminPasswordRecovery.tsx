import { useState } from "react";
import { Check, Clipboard, Clock3, KeyRound, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const statusLabel: Record<string, string> = {
  pending: "جديد", reviewing: "قيد التحقق", link_issued: "أُصدر الرابط", completed: "مكتمل", rejected: "مرفوض",
};
export default function AdminPasswordRecovery() {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [issuedLink, setIssuedLink] = useState<{ id: number; url: string } | null>(null);
  const utils = trpc.useUtils();
  const requests = trpc.admin.passwordRecoveryRequests.useQuery();
  const update = trpc.admin.updatePasswordRecoveryRequest.useMutation({
    onSuccess: () => { toast.success("تم تحديث الطلب"); utils.admin.passwordRecoveryRequests.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const issue = trpc.admin.issuePasswordRecoveryLink.useMutation({
    onSuccess: result => {
      const requestId = issue.variables?.id;
      const url = `${window.location.origin}/reset-password?token=${encodeURIComponent(result.token)}`;
      setIssuedLink({ id: requestId || 0, url });
      toast.success("تم إنشاء رابط صالح لمدة 30 دقيقة. انسخه وأرسله يدوياً بعد التحقق من الهوية.");
      utils.admin.passwordRecoveryRequests.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("تم نسخ الرابط"); }
    catch { toast.error("تعذر النسخ؛ حدد الرابط وانسخه يدوياً"); }
  };
  return <section id="admin-password-recovery" className="mt-10 rounded-2xl border border-[#dce7df] bg-white p-5 sm:p-7">
    <div className="flex items-start gap-3"><span className="join-icon"><KeyRound size={19} /></span><div><p className="eyebrow">دعم الحسابات</p><h2 className="section-title mt-2 text-3xl">طلبات استعادة كلمة المرور</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#718780]">تحقق من هوية العضو عبر وسيلة موثوقة قبل إصدار الرابط. الرابط يظهر مرة واحدة فقط، صالح 30 دقيقة، ولا ترسله إلى جهة غير متحققة.</p></div></div>
    {requests.isLoading ? <div className="p-8 text-center"><Loader2 className="mx-auto animate-spin" /></div> : !requests.data?.length ? <div className="empty-state mt-6"><ShieldCheck size={24} /><p>لا توجد طلبات استعادة حالياً.</p></div> : <div className="mt-6 space-y-4">{requests.data.map(request => <article key={request.id} className="rounded-2xl border border-[#e3ebe5] bg-[#fbfcfa] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#183b39]">{request.email}</h3><span className="rounded-full bg-[#e9f1eb] px-3 py-1 text-xs font-bold text-[#52766d]">{statusLabel[request.status]}</span></div><p className="mt-2 flex items-center gap-2 text-sm text-[#52766d]"><MessageCircle size={15} /> {request.contact}</p><p className="mt-1 flex items-center gap-2 text-xs text-[#82948e]"><Clock3 size={14} /> {new Date(request.createdAt).toLocaleString("ar-EG")}</p>{request.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#48665f]">{request.message}</p>}</div><div className="text-xs text-[#82948e]">رقم الطلب #{request.id}</div></div>
      <label className="mt-4 block text-xs font-bold text-[#52766d]">ملاحظة داخلية للمدير<textarea value={notes[request.id] ?? request.adminNote ?? ""} onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))} maxLength={1000} className="mt-2 min-h-20 w-full rounded-xl border border-[#dce7df] bg-white p-3 text-sm" placeholder="نتيجة التحقق أو ملاحظات المتابعة" /></label>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={update.isPending || request.status === "reviewing"} onClick={() => update.mutate({ id: request.id, status: "reviewing", adminNote: notes[request.id] ?? request.adminNote ?? "" })} className="rounded-xl bg-[#e6efe8] px-4 py-2 text-sm font-bold text-[#385a53] disabled:opacity-50">بدء التحقق</button>
        <button type="button" disabled={issue.isPending || request.status !== "reviewing"} onClick={() => issue.mutate({ id: request.id })} className="cta-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50">{issue.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} إصدار رابط مؤقت</button>
        {request.status === "link_issued" && <button type="button" onClick={() => update.mutate({ id: request.id, status: "completed", adminNote: notes[request.id] ?? request.adminNote ?? "" })} className="rounded-xl border border-[#b9cec2] px-4 py-2 text-sm font-bold text-[#52766d]"><Check size={16} className="mr-1 inline" /> إغلاق كمكتمل</button>}
        {request.status !== "completed" && request.status !== "rejected" && <button type="button" onClick={() => update.mutate({ id: request.id, status: "rejected", adminNote: notes[request.id] ?? request.adminNote ?? "" })} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">رفض الطلب</button>}
      </div>
      {issuedLink?.id === request.id && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">انسخ الرابط الآن وأرسله للعضو عبر وسيلة التواصل بعد التحقق. لن يظهر مجدداً بعد مغادرة هذه الصفحة.</p><div className="mt-3 flex gap-2"><input readOnly value={issuedLink.url} className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-xs" dir="ltr" /><button type="button" onClick={() => copy(issuedLink.url)} className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-bold text-white"><Clipboard size={15} className="inline" /> نسخ</button></div></div>}
    </article>)}</div>}
  </section>;
}
