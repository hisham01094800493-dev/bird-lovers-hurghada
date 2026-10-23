import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bird, Loader2, Mail, KeyRound, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";

export default function PasswordReset({ reset = false }: { reset?: boolean }) {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const request = trpc.auth.requestPasswordReset.useMutation();
  const change = trpc.auth.resetPassword.useMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (reset) {
        await change.mutateAsync({ token, password });
        toast.success("تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.");
        navigate("/login");
      } else {
        const result = await request.mutateAsync({ email });
        toast.success(result.emailConfigured
          ? "إذا كان البريد مرتبطاً بحساب، فستصلك رسالة برابط الاستعادة خلال دقائق."
          : "ميزة الإرسال لم تُفعّل بعد. يلزم إعداد خدمة البريد أولاً.");
      }
    } catch (error: any) {
      toast.error(reset && error?.data?.code === "BAD_REQUEST" ? "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً." : "تعذر إتمام الطلب، حاول مرة أخرى.");
    }
  };
  const whatsappUrl = `https://wa.me/201065303382?text=${encodeURIComponent(`مرحباً، نسيت كلمة مرور حسابي في Bird Lovers Hurghada. البريد المستخدم في الحساب: ${email || ""}. أرجو مساعدتي في استعادة الحساب.`)}`;
  return <SiteShell><section className="shell py-12 sm:py-20"><Link href="/login" className="back-link"><ArrowLeft size={16} /> العودة لتسجيل الدخول</Link><div className="mx-auto mt-10 max-w-xl rounded-[28px] border border-[#dce7df] bg-white p-8 shadow-[0_24px_80px_rgba(24,59,57,.10)] sm:p-12"><span className="brand-mark"><Bird size={24} /></span><h1 className="mt-7 font-display text-3xl font-semibold text-[#183b39]">{reset ? "اختر كلمة مرور جديدة" : "استعادة كلمة المرور"}</h1><p className="mt-3 text-sm leading-7 text-[#718780]">{reset ? "أنشئ كلمة مرور جديدة لا تقل عن 8 أحرف." : "أدخل البريد الإلكتروني المستخدم عند إنشاء حسابك وسنرسل لك رابطاً آمناً."}</p>{reset && !token ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">رابط الاستعادة غير مكتمل. اطلب رابطاً جديداً.</p> : <form onSubmit={submit} className="mt-7 space-y-4">{reset ? <label className="block text-sm font-bold text-[#385a53]">كلمة المرور الجديدة<input type="password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4" autoComplete="new-password" /></label> : <label className="block text-sm font-bold text-[#385a53]">البريد الإلكتروني<input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4" placeholder="name@example.com" autoComplete="email" /></label>}<button type="submit" disabled={request.isPending || change.isPending || (reset && !token)} className="cta-primary w-full">{request.isPending || change.isPending ? <Loader2 size={18} className="animate-spin" /> : reset ? <KeyRound size={18} /> : <Mail size={18} />}{reset ? "حفظ كلمة المرور" : "إرسال رابط الاستعادة"}</button></form>}{!reset && <div className="mt-8 border-t border-[#e8eee9] pt-6"><h2 className="font-display text-xl font-semibold text-[#183b39]">استعد حسابك عبر واتساب</h2><p className="mt-2 text-sm leading-6 text-[#718780]">اكتب بريد حسابك أعلاه، ثم أرسل رسالة جاهزة إلى مدير الموقع. سيتحقق من ملكية الحساب قبل إرسال رابط الاستعادة.</p><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-disabled={!email} onClick={event => { if (!email) { event.preventDefault(); toast.error("اكتب بريد الحساب أولاً"); } }} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white ${email ? "bg-[#218b61]" : "bg-[#9ab4a7]"}`}><MessageCircle size={18} /> فتح واتساب وإرسال الطلب</a><p className="mt-3 text-xs leading-5 text-[#91a19c]">لن نرسل كلمة مرورك عبر واتساب؛ سيرسل المدير رابطاً مؤقتاً بعد التحقق.</p></div>}<p className="mt-6 text-center text-xs text-[#91a19c]">{reset ? "الرابط صالح لمدة 30 دقيقة ويستخدم مرة واحدة." : "إذا لم تصلك الرسالة، تحقق من مجلد البريد غير المرغوب فيه."}</p></div></section></SiteShell>;
}
