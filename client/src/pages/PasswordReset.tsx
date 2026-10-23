import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bird, Loader2, Mail, KeyRound } from "lucide-react";
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
  return <SiteShell><section className="shell py-12 sm:py-20"><Link href="/login" className="back-link"><ArrowLeft size={16} /> العودة لتسجيل الدخول</Link><div className="mx-auto mt-10 max-w-xl rounded-[28px] border border-[#dce7df] bg-white p-8 shadow-[0_24px_80px_rgba(24,59,57,.10)] sm:p-12"><span className="brand-mark"><Bird size={24} /></span><h1 className="mt-7 font-display text-3xl font-semibold text-[#183b39]">{reset ? "اختر كلمة مرور جديدة" : "استعادة كلمة المرور"}</h1><p className="mt-3 text-sm leading-7 text-[#718780]">{reset ? "أنشئ كلمة مرور جديدة لا تقل عن 8 أحرف." : "أدخل البريد الإلكتروني المستخدم عند إنشاء حسابك وسنرسل لك رابطاً آمناً."}</p>{reset && !token ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">رابط الاستعادة غير مكتمل. اطلب رابطاً جديداً.</p> : <form onSubmit={submit} className="mt-7 space-y-4">{reset ? <label className="block text-sm font-bold text-[#385a53]">كلمة المرور الجديدة<input type="password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4" autoComplete="new-password" /></label> : <label className="block text-sm font-bold text-[#385a53]">البريد الإلكتروني<input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4" placeholder="name@example.com" autoComplete="email" /></label>}<button type="submit" disabled={request.isPending || change.isPending || (reset && !token)} className="cta-primary w-full">{request.isPending || change.isPending ? <Loader2 size={18} className="animate-spin" /> : reset ? <KeyRound size={18} /> : <Mail size={18} />}{reset ? "حفظ كلمة المرور" : "إرسال رابط الاستعادة"}</button></form>}<p className="mt-6 text-center text-xs text-[#91a19c]">{reset ? "الرابط صالح لمدة 30 دقيقة ويستخدم مرة واحدة." : "إذا لم تصلك الرسالة، تحقق من مجلد البريد غير المرغوب فيه."}</p></div></section></SiteShell>;
}
