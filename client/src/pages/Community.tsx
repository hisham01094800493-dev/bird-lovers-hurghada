import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  Bird,
  BookOpen,
  CalendarDays,
  ExternalLink,
  Heart,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import SiteShell from "@/components/SiteShell";

const facebookGroup =
  "https://www.facebook.com/groups/798363001904219/?ref=share_group_link";
const labels: Record<string, string> = {
  care: "العناية",
  nutrition: "التغذية",
  health: "الصحة",
  breeding: "التفريخ",
  general: "عام",
  other: "أخرى",
};
const categoryHints: Record<string, string> = {
  care: "تنظيف القفص، الإضاءة، والتعامل اليومي",
  nutrition: "الأكل المناسب، الفيتامينات، والمياه",
  health: "علامات المرض والنصائح الوقائية",
  breeding: "التجهيز، البيض، ورعاية الفروخ",
  general: "أسئلة وتجارب مفيدة لكل المربين",
  other: "أي معلومة تخص تربية الطيور",
};

export default function Community() {
  const { isAuthenticated } = useAuth();
  const posts = trpc.community.list.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    category: "general",
    title: "",
    body: "",
    imageData: "",
    imagePreview: "",
  });
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const create = trpc.community.create.useMutation({
    onSuccess: () => {
      setForm({
        category: "general",
        title: "",
        body: "",
        imageData: "",
        imagePreview: "",
      });
      utils.community.list.invalidate();
      toast.success("تم نشر المنشور في المجتمع");
    },
    onError: error => toast.error(error.message),
  });
  const optimizeImage = (file: File) =>
    new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith("image/") || file.size > 25_000_000)
        return reject(new Error("type"));
      const source = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(source);
        const scale = Math.min(1, 1800 / image.width, 1800 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("canvas"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.onerror = () => {
        URL.revokeObjectURL(source);
        reject(new Error("image"));
      };
      image.src = source;
    });
  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imageData = await optimizeImage(file);
      setForm(current => ({ ...current, imageData, imagePreview: imageData }));
    } catch {
      toast.error("اختار صورة عادية من الهاتف بحجم أقل من 25MB");
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.body)
      return toast.error("اكتب عنوانًا وتفاصيل المنشور أولًا");
    create.mutate({
      category: form.category as
        | "care"
        | "nutrition"
        | "health"
        | "breeding"
        | "general"
        | "other",
      title: form.title,
      body: form.body,
      imageData: form.imageData || undefined,
    });
  };
  return (
    <SiteShell>
      <section className="shell page-hero">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="eyebrow-dot" /> Community / المجتمع
          </p>
          <h1 className="page-title">
            Keep the good
            <br />
            <em>advice moving.</em>
          </h1>
          <p className="page-lede">
            نشارك هنا خبرات تربية الطيور بطريقة بسيطة: نصيحة مجرّبة، سؤال واضح،
            أو صورة تعليمية تساعد غيرك.
          </p>
        </div>
        <a href={facebookGroup} target="_blank" rel="noreferrer">
          <Button variant="outline" className="cta-secondary">
            <ExternalLink size={16} /> Open Facebook group
          </Button>
        </a>
      </section>
      <section className="shell pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {posts.isLoading ? (
              [1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-[#eaf1ea]"
                />
              ))
            ) : posts.data?.length ? (
              posts.data.map(post => (
                <article key={post.id} className="post-card">
                  <div className="flex items-start gap-3">
                    <div className="avatar-placeholder">
                      <Bird size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold text-[#183b39]">
                          {post.title}
                        </h2>
                        <span className="post-category">
                          {labels[post.category] || post.category}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#69807b]">
                        {post.body}
                      </p>
                      {post.imagePath && (
                        <button
                          type="button"
                          onClick={() => setActiveImage(post.imagePath)}
                          className="mt-4 block w-full overflow-hidden rounded-2xl border border-[#dce7df] bg-[#f7faf5] text-left"
                        >
                          <img
                            src={post.imagePath}
                            alt="صورة تعليمية للمنشور — اضغط للتكبير"
                            className="max-h-80 w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      )}
                      <div className="mt-4 flex items-center gap-5 text-xs text-[#8a9b96]">
                        <span>{post.authorName || "عضو في المجتمع"}</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} />{" "}
                          {new Date(post.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      <PostInteractions
                        postId={post.id}
                        likesCount={post.likesCount}
                        commentsCount={post.commentsCount}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Users size={30} />
                <h3 className="font-display text-lg font-semibold">
                  The first question is yours.
                </h3>
                <p>Start a conversation about the birds you love.</p>
              </div>
            )}
          </div>
          <aside className="space-y-5">
            <div className="post-composer">
              <div className="flex items-center gap-3">
                <span className="join-icon">
                  <Plus size={18} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    شارك معلومة تفيد غيرك
                  </h2>
                  <p className="text-xs text-[#82948d]">
                    اكتب نصيحة واضحة أو سؤالًا يساعد المربين.
                  </p>
                </div>
              </div>
              {isAuthenticated ? (
                <form onSubmit={submit} className="mt-5 space-y-3">
                  <Input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="عنوان واضح، مثل: أفضل أكل لفروخ البادجي"
                    maxLength={180}
                  />
                  <Select
                    value={form.category}
                    onValueChange={value =>
                      setForm({ ...form, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختار نوع المعلومة" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] max-h-[280px] max-w-[calc(100vw-48px)] overflow-y-auto border-2 border-[#183b39] bg-white opacity-100 shadow-xl">
                      {Object.entries(labels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex flex-col">
                            <strong>{label}</strong>
                            <small>{categoryHints[value]}</small>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    placeholder="اكتب التفاصيل: ماذا حدث؟ وما النصيحة التي تريد مشاركتها؟"
                    className="min-h-28"
                  />
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#b9cec0] bg-[#f7faf5] px-3 py-3 text-sm font-semibold text-[#527169]">
                    <ImagePlus size={17} /> إضافة صورة تعليمية أو توضيحية
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={chooseImage}
                    />
                  </label>
                  {form.imagePreview && (
                    <div className="relative overflow-hidden rounded-xl border border-[#dce7df] bg-white">
                      <img
                        src={form.imagePreview}
                        alt="معاينة الصورة التعليمية"
                        className="max-h-52 w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, imageData: "", imagePreview: "" })
                        }
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-[#bd5941] shadow"
                        aria-label="إزالة الصورة"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs leading-5 text-[#82948d]">
                    الصورة اختيارية، وسيتم ضغطها تلقائيًا قبل النشر.
                  </p>
                  <Button
                    type="submit"
                    className="cta-primary w-full"
                    disabled={create.isPending}
                  >
                    {create.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}{" "}
                    نشر في المجتمع
                  </Button>
                </form>
              ) : (
                <>
                  <p className="mt-5 text-sm leading-6 text-[#6f8580]">
                    Log in to ask questions, share care tips and reply to
                    neighbours.
                  </p>
                  <Button
                    className="cta-primary mt-4 w-full"
                    onClick={() => startLogin()}
                  >
                    Log in to post
                  </Button>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-[#dce7df] bg-[#eef5ed] p-5">
              <div className="flex items-start gap-3">
                <span className="join-icon">
                  <Lightbulb size={18} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#183b39]">
                    خلي منشورك مفيد
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#69807b]">
                    اكتب المعلومة كاملة، اذكر نوع الطائر وعمره إن أمكن، وارفع
                    صورة توضّح الفكرة. تجنّب نشر أرقام الهاتف أو بيانات خاصة.
                  </p>
                </div>
              </div>
            </div>
            <div className="facebook-note">
              <ExternalLink size={18} className="text-[#d26246]" />
              <div>
                <h3>Still part of the same flock</h3>
                <p>
                  Keep up with the original group while the marketplace grows
                  here.
                </p>
                <a
                  href={facebookGroup}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[#d26246]"
                >
                  Visit Facebook group <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </aside>
          <div>
            {activeImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a29]/90 p-4"
                role="dialog"
                aria-label="عرض الصورة"
                onClick={() => setActiveImage(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-xl font-bold text-[#183b39] shadow"
                  aria-label="إغلاق الصورة"
                >
                  ×
                </button>
                <img
                  src={activeImage}
                  alt="صورة تعليمية مكبرة"
                  className="max-h-[88vh] max-w-full rounded-2xl object-contain"
                  decoding="async"
                  onClick={event => event.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function PostInteractions({
  postId,
  likesCount,
  commentsCount,
  isAuthenticated,
}: {
  postId: number;
  likesCount: number;
  commentsCount: number;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const liked = trpc.community.liked.useQuery(
    { postId },
    { enabled: isAuthenticated }
  );
  const comments = trpc.community.comments.useQuery(
    { postId },
    { enabled: open }
  );
  const like = trpc.community.toggleLike.useMutation({
    onSuccess: () => {
      utils.community.list.invalidate();
      liked.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const comment = trpc.community.comment.useMutation({
    onSuccess: () => {
      setBody("");
      utils.community.comments.invalidate({ postId });
      utils.community.list.invalidate();
      toast.success("تم إضافة تعليقك + نقطتين لسرب المساعدة");
    },
    onError: error => toast.error(error.message),
  });
  const helpful = trpc.community.markHelpful.useMutation({
    onSuccess: result => {
      utils.community.comments.invalidate({ postId });
      toast.success(
        result.helpful ? "تم تسجيل الإجابة المفيدة" : "تم تسجيل التقييم من قبل"
      );
    },
    onError: error => toast.error(error.message),
  });
  return (
    <div className="mt-4 border-t border-[#edf1ed] pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            isAuthenticated ? like.mutate({ postId }) : startLogin()
          }
          disabled={like.isPending}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${liked.data ? "bg-[#fff0ed] text-[#bd5941]" : "text-[#718780] hover:bg-[#f3f7f2]"}`}
        >
          <Heart size={16} fill={liked.data ? "currentColor" : "none"} />{" "}
          {likesCount}
        </button>
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#718780] hover:bg-[#f3f7f2]"
        >
          <MessageCircle size={16} /> {commentsCount} تعليق
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 rounded-2xl bg-[#f7faf5] p-3">
          {comments.isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : comments.data?.length ? (
            comments.data.map(item => (
              <div key={item.id} className="rounded-xl bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-[#527169]">
                    {item.authorName || "عضو"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef5ed] px-2 py-1 text-[10px] font-bold text-[#52766d]">
                    <Award size={12} /> عضو السرب
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#526b64]">
                  {item.body}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated
                      ? helpful.mutate({ commentId: item.id })
                      : startLogin()
                  }
                  disabled={helpful.isPending}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#f7faf5] px-3 py-1.5 text-xs font-semibold text-[#52766d] transition hover:bg-[#eaf4ea]"
                >
                  <ThumbsUp size={13} /> إجابة مفيدة · {item.helpfulCount || 0}
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#82948d]">
              كن أول من يضيف تعليقًا مفيدًا.
            </p>
          )}
          {isAuthenticated ? (
            <form
              onSubmit={event => {
                event.preventDefault();
                if (body.trim()) comment.mutate({ postId, body: body.trim() });
              }}
              className="flex gap-2"
            >
              <Input
                value={body}
                onChange={event => setBody(event.target.value)}
                placeholder="اكتب تعليقًا مفيدًا…"
                maxLength={1000}
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0 rounded-xl bg-[#183b39] text-white"
                disabled={comment.isPending || !body.trim()}
                aria-label="إضافة تعليق"
              >
                <Send size={15} />
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => startLogin()}
            >
              سجّل الدخول لإضافة تعليق
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
