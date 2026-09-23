import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ImageIcon,
  ImagePlus,
  Loader2,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";

const birdAvatars = [
  { label: "بادجي", url: "/images/hurghada-budgie-card.jpg" },
  { label: "ببغاء", url: "/images/hurghada-parrot-hero.jpg" },
  { label: "كوكاتيل", url: "/images/listing-cockatiel.jpg" },
  { label: "ماكاو", url: "/images/listing-blue-gold-macaw.jpg" },
];

export default function Profile() {
  const { isAuthenticated, loading } = useAuth();
  const profile = trpc.profile.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const reputation = trpc.profile.reputation.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    bio: "",
    whatsappOptIn: false,
    avatarUrl: "",
  });
  useEffect(() => {
    if (profile.data)
      setForm({
        name: profile.data.name || "",
        phone: profile.data.phone || "",
        area: profile.data.area || "",
        bio: profile.data.bio || "",
        whatsappOptIn: profile.data.whatsappOptIn,
        avatarUrl: profile.data.avatarUrl || "",
      });
  }, [profile.data]);
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile preferences saved");
      profile.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const requestVerification =
    trpc.profile.requestContactVerification.useMutation({
      onSuccess: () => toast.success("Verification request sent to admin"),
      onError: error => toast.error(error.message),
    });
  const uploadAvatar = trpc.profile.uploadAvatar.useMutation({
    onSuccess: data => {
      setForm(current => ({
        ...current,
        avatarUrl: data?.avatarUrl || current.avatarUrl,
      }));
      profile.refetch();
      toast.success("تم تحديث الصورة الشخصية");
    },
    onError: error => toast.error(error.message),
  });
  if (loading || (isAuthenticated && profile.isLoading))
    return (
      <SiteShell>
        <div className="shell py-24 text-center">
          <Loader2 className="mx-auto animate-spin" />
        </div>
      </SiteShell>
    );
  if (!isAuthenticated)
    return (
      <SiteShell>
        <div className="shell py-24">
          <div className="auth-card">
            <span className="brand-mark mx-auto">
              <UserRound size={20} />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold">
              Your profile travels with your listings.
            </h1>
            <Button className="cta-primary mt-7" onClick={() => startLogin()}>
              Log in securely
            </Button>
          </div>
        </div>
      </SiteShell>
    );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(form);
  };
  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4_000_000)
      return toast.error("اختار صورة أقل من 4 ميجابايت");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string")
        uploadAvatar.mutate({ imageData: reader.result });
    };
    reader.readAsDataURL(file);
  };
  return (
    <SiteShell>
      <section className="shell py-10 sm:py-16">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back home
        </Link>
        <div className="mx-auto mt-8 grid max-w-5xl gap-9 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="eyebrow">Profile / الملف الشخصي</p>
            <h1 className="page-title mt-3">
              A profile people
              <br />
              <em>can trust.</em>
            </h1>
            <p className="page-lede">
              Keep your public contact preferences clear and respectful.
            </p>
            <div className="profile-avatar-card mt-8 rounded-3xl border border-[#dce7df] bg-white p-5 shadow-[0_14px_35px_rgba(24,59,57,.06)]">
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-[#eef5ed] text-[#52766d]">
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="الصورة الشخصية"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={30} />
                  )}
                </div>
                <div>
                  <p className="eyebrow">صورتك في السرب</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-[#183b39]">
                    اختار صورة بتحبها
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#718780]">
                    استخدم صورتك أو اختار طيرًا جاهزًا.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#183b39] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#315a54]">
                  <ImagePlus size={15} /> رفع صورة
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={chooseAvatar}
                  />
                </label>
                {birdAvatars.map(avatar => (
                  <button
                    key={avatar.url}
                    type="button"
                    onClick={() =>
                      setForm(current => ({
                        ...current,
                        avatarUrl: avatar.url,
                      }))
                    }
                    className={`size-11 overflow-hidden rounded-xl border-2 transition ${form.avatarUrl === avatar.url ? "border-[#d26246] ring-2 ring-[#d26246]/20" : "border-[#dce7df] hover:border-[#76a68f]"}`}
                    aria-label={`اختيار صورة ${avatar.label}`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#82948e]">
                اضغط حفظ الملف الشخصي بعد اختيار صورة جاهزة.
              </p>
            </div>
            <form onSubmit={submit} className="form-card mt-5 space-y-5">
              <label className="field">
                <span>Display name</span>
                <Input
                  value={form.name}
                  onChange={event =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Phone number</span>
                <Input
                  value={form.phone}
                  onChange={event =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="+20…"
                />
              </label>
              <div className="verification-box">
                <div className="flex items-center gap-2">
                  {profile.data?.phoneVerifiedAt ? (
                    <BadgeCheck size={17} className="text-[#4c816a]" />
                  ) : (
                    <Clock3 size={17} className="text-[#9d733f]" />
                  )}
                  <strong>
                    {profile.data?.phoneVerifiedAt
                      ? "Phone verified"
                      : "Phone not verified"}
                  </strong>
                </div>
                <p>
                  {profile.data?.phoneVerifiedAt
                    ? "Your verified WhatsApp contact can appear on opted-in listings."
                    : "Request a manual review before your number can appear publicly."}
                </p>
                {!profile.data?.phoneVerifiedAt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      requestVerification.mutate({ phone: form.phone })
                    }
                    disabled={!form.phone || requestVerification.isPending}
                  >
                    Request verification
                  </Button>
                )}
              </div>
              <label className="field">
                <span>Area</span>
                <Input
                  value={form.area}
                  onChange={event =>
                    setForm({ ...form, area: event.target.value })
                  }
                  placeholder="El Kawther, Hurghada"
                />
              </label>
              <label className="field">
                <span>Short bio</span>
                <Textarea
                  value={form.bio}
                  onChange={event =>
                    setForm({ ...form, bio: event.target.value })
                  }
                  maxLength={600}
                  placeholder="A little about you and the homes you care about…"
                />
              </label>
              <label className="check-label rounded-xl bg-[#f4f8f3] p-4">
                <Checkbox
                  checked={form.whatsappOptIn}
                  onCheckedChange={value =>
                    setForm({ ...form, whatsappOptIn: Boolean(value) })
                  }
                />
                <span>
                  <strong className="block text-[#183b39]">
                    Allow WhatsApp contact
                  </strong>
                  <small className="mt-1 block leading-5 text-[#718780]">
                    Your number appears on listings only when you explicitly
                    enable this and verification is complete.
                  </small>
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="cta-primary"
                  disabled={update.isPending}
                >
                  {update.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}{" "}
                  Save profile
                </Button>
                <Link href="/my-listings" className="cta-secondary inline-flex">
                  <ImageIcon size={16} /> Manage my listings
                </Link>
              </div>
            </form>
          </div>
          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#dce7df] bg-[#183b39] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#b9d8c8]">
                    سرب المساعدة
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">
                    {reputation.data?.badge.ar || "عضو جديد"}
                  </h3>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#f1d1a4]">
                  <Award size={20} />
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <strong className="font-display text-3xl">
                  {reputation.data?.points || 0}
                </strong>
                <span className="text-xs text-[#b9d8c8]">نقطة</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#f1d1a4] transition-all"
                  style={{ width: `${reputation.data?.progress || 0}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#b9d8c8]">
                {reputation.data
                  ? `${reputation.data.nextTarget - reputation.data.points > 0 ? reputation.data.nextTarget - reputation.data.points : 0} نقطة للوصول للشارة التالية`
                  : "ابدأ برد مفيد في قسم الرعاية"}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/10 p-3">
                  <strong className="block text-lg text-white">
                    {reputation.data?.helpfulAnswers || 0}
                  </strong>
                  <span className="text-[#b9d8c8]">إجابات مفيدة</span>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <strong className="block text-lg text-white">
                    {reputation.data?.commentsCount || 0}
                  </strong>
                  <span className="text-[#b9d8c8]">ردود</span>
                </div>
              </div>
            </div>
            <div className="side-note">
              <ShieldCheck size={22} className="text-[#76a68f]" />
              <h3>Trust by design</h3>
              <p>
                Only your display name and area are shown by default. Contact
                details stay private until you choose a channel.
              </p>
            </div>
            <div className="side-note warm">
              <Phone size={22} className="text-[#d26246]" />
              <h3>WhatsApp is optional.</h3>
              <p>
                In-app messages remain the default, so you can keep
                conversations tied to a listing.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
