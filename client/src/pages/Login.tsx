import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bird, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteShell from "@/components/SiteShell";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const busy = login.isPending || register.isPending;

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "register") {
        await register.mutateAsync({ name, email, password });
        toast.success("تم إنشاء الحساب وتسجيل الدخول بنجاح");
      } else {
        await login.mutateAsync({ email, password });
        toast.success("تم تسجيل الدخول بنجاح");
      }
      await refresh();
      navigate("/");
    } catch (error: any) {
      const message = error?.data?.code === "CONFLICT" ? "هذا البريد مسجل بالفعل" : error?.data?.code === "UNAUTHORIZED" ? "البريد أو كلمة المرور غير صحيحة" : "تعذر إتمام العملية، حاول مرة أخرى";
      toast.error(message);
    }
  };

  return <SiteShell><section className="shell py-12 sm:py-20"><Link href="/" className="back-link"><ArrowLeft size={16} /> العودة للرئيسية</Link><div className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-[28px] border border-[#dce7df] bg-white shadow-[0_24px_80px_rgba(24,59,57,.10)] md:grid-cols-[.9fr_1.1fr]"><div className="login-intro p-8 sm:p-12"><span className="brand-mark"><Bird size={24} /></span><p className="eyebrow mt-8">Bird Lovers Hurghada</p><h1 className="page-title mt-4">مكانك بين<br /><em>أهل السرب.</em></h1><p className="mt-6 max-w-sm text-sm leading-7 text-[#69807b]">سجّل حسابك مباشرة بالبريد الإلكتروني. بدون خادم OAuth خارجي، وبطريقة بسيطة وآمنة للتواصل وحفظ إعلاناتك.</p><ul className="mt-8 space-y-3 text-sm text-[#456862]"><li>✓ احفظ إعلاناتك المفضلة</li><li>✓ راسل البائعين مباشرة</li><li>✓ انشر إعلان طيورك بسهولة</li></ul></div><div className="p-8 sm:p-12"><div className="flex gap-2 rounded-xl bg-[#f2f6f1] p-1"><button type="button" className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${mode === "login" ? "bg-white text-[#183b39] shadow-sm" : "text-[#82948e]"}`} onClick={() => setMode("login")}><LogIn size={15} className="mr-2 inline" />دخول</button><button type="button" className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${mode === "register" ? "bg-white text-[#183b39] shadow-sm" : "text-[#82948e]"}`} onClick={() => setMode("register")}><UserPlus size={15} className="mr-2 inline" />حساب جديد</button></div><h2 className="mt-8 font-display text-2xl font-semibold text-[#183b39]">{mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}</h2><p className="mt-2 text-sm text-[#82948e]">{mode === "login" ? "اكتب بياناتك للمتابعة." : "ابدأ خلال دقيقة واحدة."}</p><form onSubmit={submit} className="mt-7 space-y-4">{mode === "register" && <label className="block text-sm font-bold text-[#385a53]">الاسم<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder="اسمك" /></label>}<label className="block text-sm font-bold text-[#385a53]">البريد الإلكتروني<input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder="name@example.com" /></label><label className="block text-sm font-bold text-[#385a53]">كلمة المرور<div className="relative mt-2"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} className="h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 pr-12 outline-none focus:border-[#76a68f]" placeholder="8 أحرف على الأقل" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-3 text-[#82948e]" aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><button type="submit" disabled={busy} className="cta-primary mt-3 w-full">{busy ? <Loader2 size={18} className="animate-spin" /> : mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}{mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button></form><p className="mt-6 text-center text-xs leading-5 text-[#91a19c]">بإنشاء الحساب، توافق على استخدام الموقع للتواصل الآمن بين أعضاء المجتمع.</p></div></div></section></SiteShell>;
}
