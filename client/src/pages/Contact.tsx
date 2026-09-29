import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Send,
  Store,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { useLanguage } from "@/contexts/LanguageContext";

const CONTACT_EMAIL = "h201065303382@gmail.com";

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  business: string;
  requestType: "directory" | "advertising" | "product" | "other";
  message: string;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  business: "",
  requestType: "directory",
  message: "",
};

export default function Contact() {
  const { isArabic } = useLanguage();
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [sent, setSent] = useState(false);
  const update = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.message.trim().length < 10) {
      toast.error(isArabic ? "اكتب تفاصيل أكثر عن طلبك" : "Please add a little more detail");
      return;
    }
    const subject = isArabic
      ? `طلب من دليل Bird Lovers: ${form.business || form.name}`
      : `Bird Lovers directory request: ${form.business || form.name}`;
    const body = [
      `${isArabic ? "الاسم" : "Name"}: ${form.name}`,
      `${isArabic ? "البريد" : "Email"}: ${form.email}`,
      `${isArabic ? "الهاتف" : "Phone"}: ${form.phone || "—"}`,
      `${isArabic ? "المحل / الجهة" : "Business / organisation"}: ${form.business || "—"}`,
      `${isArabic ? "نوع الطلب" : "Request type"}: ${form.requestType}`,
      "",
      form.message,
    ].join("\n");
    window.location.assign(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSent(true);
    toast.success(isArabic ? "تم تجهيز رسالة البريد" : "Your email draft is ready");
  };

  return (
    <SiteShell>
      <section className="shell page-hero">
        <div>
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> {isArabic ? "الرئيسية" : "Home"}
          </Link>
          <p className="eyebrow mt-6 flex items-center gap-2">
            <span className="eyebrow-dot" />
            {isArabic ? "أضف صوتك إلى الدليل" : "Help us grow the local guide"}
          </p>
          <h1 className="page-title mt-3">
            {isArabic ? <>خلّينا نسمع<br /><em>منك.</em></> : <>Let’s hear<br /><em>from you.</em></>}
          </h1>
          <p className="page-lede">
            {isArabic
              ? "هل لديك محل أو عيادة؟ تريد إضافة إعلان أو منتج؟ أرسل التفاصيل وسنراجعها قبل النشر."
              : "Run a shop or clinic? Want to add an advert or product? Send the details and we will review them before publishing."}
          </p>
        </div>
        <div className="grid size-24 place-items-center rounded-[30px] bg-[#e5e1f8] text-[#6856a6] shadow-sm">
          <Megaphone size={42} />
        </div>
      </section>

      <section className="shell pb-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_300px]">
          <form onSubmit={submit} className="form-card space-y-5">
            <div className="form-card-heading">
              <span className="step-number"><Send size={16} /></span>
              <div>
                <h2>{isArabic ? "بيانات التواصل" : "Contact details"}</h2>
                <p>{isArabic ? "سنستخدمها فقط للرد على طلبك." : "We will use them only to reply to your request."}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                <span>{isArabic ? "الاسم *" : "Name *"}</span>
                <input required maxLength={120} value={form.name} onChange={event => update("name", event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder={isArabic ? "اسمك" : "Your name"} />
              </label>
              <label className="field">
                <span>{isArabic ? "البريد الإلكتروني *" : "Email *"}</span>
                <input required type="email" maxLength={180} value={form.email} onChange={event => update("email", event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder="name@example.com" />
              </label>
              <label className="field">
                <span>{isArabic ? "رقم الهاتف" : "Phone"}</span>
                <input dir="ltr" type="tel" maxLength={40} value={form.phone} onChange={event => update("phone", event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder="+20 ..." />
              </label>
              <label className="field">
                <span>{isArabic ? "المحل أو الجهة" : "Business / organisation"}</span>
                <input maxLength={160} value={form.business} onChange={event => update("business", event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 outline-none focus:border-[#76a68f]" placeholder={isArabic ? "اختياري" : "Optional"} />
              </label>
            </div>
            <label className="field block">
              <span>{isArabic ? "نوع الطلب" : "Request type"}</span>
              <select value={form.requestType} onChange={event => update("requestType", event.target.value as ContactForm["requestType"])} className="mt-2 h-12 w-full rounded-xl border border-[#dce7df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#76a68f]">
                <option value="directory">{isArabic ? "إضافة إلى الدليل" : "Add to directory"}</option>
                <option value="advertising">{isArabic ? "إعلان مدفوع" : "Paid advertising"}</option>
                <option value="product">{isArabic ? "إضافة منتج موصى به" : "Recommended product"}</option>
                <option value="other">{isArabic ? "طلب آخر" : "Other"}</option>
              </select>
            </label>
            <label className="field block">
              <span>{isArabic ? "التفاصيل *" : "Details *"}</span>
              <textarea required minLength={10} maxLength={3000} value={form.message} onChange={event => update("message", event.target.value)} className="mt-2 min-h-36 w-full resize-y rounded-xl border border-[#dce7df] bg-[#fbfcfa] p-4 text-sm leading-6 outline-none focus:border-[#76a68f]" placeholder={isArabic ? "اكتب العنوان، رابط الصفحة، وأي تفاصيل تساعدنا على التحقق…" : "Add the address, page link and any details that help us verify it…"} />
            </label>
            <div className="flex items-start gap-2 rounded-xl bg-[#eef5ed] p-3 text-xs leading-5 text-[#52766d]">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{isArabic ? "لن ننشر بياناتك قبل مراجعتها، واتصل بنا من بريدك الحقيقي حتى نستطيع الرد." : "We will not publish your details before review. Use a real email so we can reply."}</span>
            </div>
            <button type="submit" className="cta-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
              <Send size={17} /> {isArabic ? "إرسال الطلب" : "Send request"}
            </button>
            {sent && <p className="text-xs font-bold text-[#52766d]">{isArabic ? "إذا لم يفتح تطبيق البريد، راسلنا مباشرة من بريدك." : "If your mail app did not open, email us directly from your inbox."}</p>}
          </form>

          <aside className="space-y-4">
            <div className="side-note">
              <Store size={22} className="text-[#d26246]" />
              <h3>{isArabic ? "لأصحاب المحلات" : "For shop owners"}</h3>
              <p>{isArabic ? "أرسل رقم الهاتف، العنوان، رابط الخريطة، ورابط صفحتك العامة." : "Send your phone, address, map link and public page."}</p>
            </div>
            <div className="side-note warm">
              <MapPin size={22} className="text-[#c49752]" />
              <h3>{isArabic ? "بيانات دقيقة أولًا" : "Accuracy first"}</h3>
              <p>{isArabic ? "نطلب التأكد من الأرقام والمواعيد قبل إضافة أي مكان للدليل." : "We ask businesses to confirm numbers and hours before we add them."}</p>
            </div>
            <div className="rounded-2xl border border-[#dce7df] bg-white p-5 text-sm leading-6 text-[#69807b]">
              <div className="flex items-center gap-2 font-bold text-[#183b39]"><Mail size={17} /> {CONTACT_EMAIL}</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-flex items-center gap-2 font-bold text-[#52766d] underline underline-offset-4"><Phone size={15} /> {isArabic ? "فتح البريد" : "Open email"}</a>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
